import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import type {
  NetworkGraph,
  NetworkNode,
  NetworkEdge,
  EntityCluster,
  RelatedWallet,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";

// All known wallets to analyze
const KEY_WALLETS = {
  root: "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
  level1: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  coinbase: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
  deployers: [
    "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2", // Original
    "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb", // Fresh #1
    "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy", // Fresh #2
  ],
};

function determineRole(
  address: string,
): "root" | "level1" | "deployer" | "cex" | "unknown" {
  if (address === KEY_WALLETS.root) return "root";
  if (address === KEY_WALLETS.level1) return "level1";
  if (address === KEY_WALLETS.coinbase) return "cex";
  if (KEY_WALLETS.deployers.includes(address)) return "deployer";
  return "unknown";
}

async function buildNetworkGraph(client: NansenClient): Promise<NetworkGraph> {
  const nodes: Map<string, NetworkNode> = new Map();
  const edges: NetworkEdge[] = [];

  // Initialize known nodes
  const allWallets = [
    KEY_WALLETS.root,
    KEY_WALLETS.level1,
    KEY_WALLETS.coinbase,
    ...KEY_WALLETS.deployers,
  ];

  for (const address of allWallets) {
    nodes.set(address, {
      address,
      role: determineRole(address),
      signers: [],
    });
  }

  console.log(
    `\n📊 Building Network Graph for ${allWallets.length} wallets...`,
  );

  // Get related wallets for each
  for (const address of allWallets) {
    console.log(`\n  Analyzing: ${address.slice(0, 12)}...`);

    const relatedWallets = await client.getRelatedWallets({
      address,
      chain: "solana",
      pagination: { page: 1, per_page: 50 },
    });

    console.log(`    Found ${relatedWallets.length} related wallets`);

    for (const rw of relatedWallets) {
      // Add edge
      edges.push({
        from: rw.address,
        to: address,
        relation: rw.relation,
        transaction_hash: rw.transaction_hash,
        timestamp: rw.block_timestamp,
      });

      // Update node data
      const node = nodes.get(address);
      if (node) {
        if (rw.relation === "First Funder") {
          node.firstFunder = rw.address;
          console.log(`    First Funder: ${rw.address.slice(0, 12)}...`);
        }
        if (rw.relation === "Signer") {
          node.signers.push(rw.address);
          console.log(`    Signer: ${rw.address.slice(0, 12)}...`);
        }
        if (rw.relation === "Deployed via") {
          node.deployedVia = rw.address;
        }
      }

      // Add related wallet as node if not exists
      if (!nodes.has(rw.address)) {
        nodes.set(rw.address, {
          address: rw.address,
          label: rw.address_label,
          role: determineRole(rw.address),
          signers: [],
        });
      }
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
    generatedAt: new Date().toISOString(),
  };
}

function buildEntityClusters(graph: NetworkGraph): EntityCluster[] {
  const clusters: EntityCluster[] = [];
  const processed = new Set<string>();

  // Group by shared signers
  const signerToWallets: Map<string, string[]> = new Map();

  for (const node of graph.nodes) {
    for (const signer of node.signers) {
      const wallets = signerToWallets.get(signer) || [];
      wallets.push(node.address);
      signerToWallets.set(signer, wallets);
    }
  }

  // Create clusters for wallets with shared signers
  let clusterId = 0;
  for (const [signer, wallets] of signerToWallets) {
    if (wallets.length > 1) {
      // Multiple wallets share this signer
      const clusterWallets = new Set<string>(wallets);
      clusterWallets.add(signer);

      // Check if any of these wallets are already in a cluster
      const existingCluster = clusters.find((c) =>
        c.wallets.some((w) => clusterWallets.has(w)),
      );

      if (existingCluster) {
        // Merge into existing cluster
        clusterWallets.forEach((w) => {
          if (!existingCluster.wallets.includes(w)) {
            existingCluster.wallets.push(w);
          }
        });
      } else {
        // Create new cluster
        clusters.push({
          entityId: `entity_${clusterId++}`,
          wallets: Array.from(clusterWallets),
          relationships: wallets.map((w) => ({
            address: w,
            relation: "Signer" as const,
          })),
          confidenceScore: 90, // High confidence for shared signers
          primaryWallet: wallets[0],
          description: `Wallets sharing signer ${signer.slice(0, 8)}...`,
        });
      }
    }
  }

  // Create cluster for funding chain
  const fundingChainCluster: EntityCluster = {
    entityId: "entity_funding_chain",
    wallets: [KEY_WALLETS.root, KEY_WALLETS.level1, ...KEY_WALLETS.deployers],
    relationships: [
      { address: KEY_WALLETS.root, relation: "First Funder" },
      { address: KEY_WALLETS.level1, relation: "First Funder" },
    ],
    confidenceScore: 95,
    primaryWallet: KEY_WALLETS.level1,
    description: "Primary funding chain (ROOT → LEVEL1 → Deployers)",
  };
  clusters.push(fundingChainCluster);

  return clusters;
}

function printNetworkSummary(
  graph: NetworkGraph,
  clusters: EntityCluster[],
): void {
  console.log("\n" + "═".repeat(50));
  console.log("📊 NETWORK GRAPH SUMMARY");
  console.log("═".repeat(50));

  console.log(`\nNodes: ${graph.nodes.length}`);
  console.log(`Edges: ${graph.edges.length}`);

  // Count by role
  const roleCount: Record<string, number> = {};
  for (const node of graph.nodes) {
    roleCount[node.role] = (roleCount[node.role] || 0) + 1;
  }
  console.log("\nNodes by Role:");
  for (const [role, count] of Object.entries(roleCount)) {
    console.log(`  ${role}: ${count}`);
  }

  // Count by relation type
  const relationCount: Record<string, number> = {};
  for (const edge of graph.edges) {
    relationCount[edge.relation] = (relationCount[edge.relation] || 0) + 1;
  }
  console.log("\nEdges by Relation:");
  for (const [relation, count] of Object.entries(relationCount)) {
    console.log(`  ${relation}: ${count}`);
  }

  // Print funding hierarchy
  console.log("\nFunding Hierarchy:");
  const rootNode = graph.nodes.find((n) => n.address === KEY_WALLETS.root);
  const level1Node = graph.nodes.find((n) => n.address === KEY_WALLETS.level1);

  console.log(`  ROOT: ${KEY_WALLETS.root.slice(0, 12)}...`);
  if (rootNode?.firstFunder) {
    console.log(`    ↑ Funded by: ${rootNode.firstFunder.slice(0, 12)}...`);
  }
  console.log(`    ↓`);
  console.log(`  LEVEL 1: ${KEY_WALLETS.level1.slice(0, 12)}...`);
  if (level1Node?.firstFunder) {
    console.log(
      `    ↑ Funded by: ${level1Node.firstFunder.slice(0, 12)}... (should be ROOT)`,
    );
  }
  console.log(`    ↓`);
  for (const deployer of KEY_WALLETS.deployers) {
    const deployerNode = graph.nodes.find((n) => n.address === deployer);
    console.log(`  DEPLOYER: ${deployer.slice(0, 12)}...`);
    if (deployerNode?.firstFunder) {
      console.log(
        `    ↑ Funded by: ${deployerNode.firstFunder.slice(0, 12)}...`,
      );
    }
  }

  // Print entity clusters
  console.log("\nEntity Clusters:");
  for (const cluster of clusters) {
    console.log(
      `  ${cluster.entityId} (${cluster.confidenceScore}% confidence)`,
    );
    console.log(`    Wallets: ${cluster.wallets.length}`);
    console.log(`    ${cluster.description || ""}`);
  }

  // Print signers
  console.log("\nSigners Found:");
  for (const node of graph.nodes) {
    if (node.signers.length > 0) {
      console.log(
        `  ${node.address.slice(0, 12)}... has ${node.signers.length} signers:`,
      );
      for (const signer of node.signers) {
        console.log(`    - ${signer.slice(0, 12)}...`);
      }
    }
  }
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  console.log("🚀 Starting Network Graph Analysis");
  console.log("═".repeat(50));

  // Build graph
  const graph = await buildNetworkGraph(client);

  // Build entity clusters
  const clusters = buildEntityClusters(graph);

  // Save results
  const outputDir = path.join(process.cwd(), "data", "analysis");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save graph
  const graphPath = path.join(outputDir, "network-graph.json");
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));
  console.log(`\n✅ Network graph saved to: ${graphPath}`);

  // Save clusters
  const clustersPath = path.join(outputDir, "entity-clusters.json");
  fs.writeFileSync(clustersPath, JSON.stringify(clusters, null, 2));
  console.log(`✅ Entity clusters saved to: ${clustersPath}`);

  // Print summary
  printNetworkSummary(graph, clusters);
}

main().catch(console.error);
