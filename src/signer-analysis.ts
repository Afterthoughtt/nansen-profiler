import "dotenv/config";
import { NansenClient } from "./nansen-client.js";
import type { EntityCluster, RelatedWallet } from "./types.js";
import * as fs from "fs";
import * as path from "path";

const KEY_WALLETS = {
  root: "9Z83ZAtd7vjEFvXfKkjBZtAPTgeJZ1GzK7b1Uf1E3DsF",
  level1: "v49jgwyQy9zu4oeemnq3ytjRkyiJth5HKiXSstk8aV5",
  deployers: [
    "37XxihfsTW1EFSJJherWFRFWcAFhj4KQ66cXHiegSKg2",
    "D7MsVpaXFP9sBCr8em4g4iGKYLBg2C2iwCAhBVUNHLXb",
    "DBmxMiP8xeiZ4T45AviCjZCmmmTFETFU8VtsC8vdJZWy",
  ],
};

interface SignerAnalysis {
  generatedAt: string;
  walletSigners: {
    address: string;
    role: string;
    signers: {
      address: string;
      label?: string;
      sharedWith: string[];
    }[];
  }[];
  sharedSignerClusters: EntityCluster[];
  hiddenWallets: {
    address: string;
    discoveredVia: string;
    relation: string;
  }[];
  summary: {
    totalSignersFound: number;
    walletsWithSharedSigners: number;
    hiddenWalletsDiscovered: number;
  };
}

async function analyzeSignersForWallet(
  client: NansenClient,
  address: string,
  role: string,
): Promise<SignerAnalysis["walletSigners"][0]> {
  console.log(`\n📊 Analyzing signers for ${role}`);
  console.log(`   Address: ${address.slice(0, 12)}...`);

  const result: SignerAnalysis["walletSigners"][0] = {
    address,
    role,
    signers: [],
  };

  const relatedWallets = await client.getRelatedWallets({
    address,
    chain: "solana",
    pagination: { page: 1, per_page: 50 },
  });

  const signers = relatedWallets.filter((rw) => rw.relation === "Signer");
  console.log(`   Found ${signers.length} signers`);

  for (const signer of signers) {
    result.signers.push({
      address: signer.address,
      label: signer.address_label,
      sharedWith: [], // Will be filled in cross-reference step
    });
    console.log(
      `     - ${signer.address.slice(0, 12)}... ${signer.address_label || ""}`,
    );
  }

  return result;
}

function findSharedSignerClusters(
  walletSigners: SignerAnalysis["walletSigners"],
): EntityCluster[] {
  const clusters: EntityCluster[] = [];
  const signerToWallets: Map<string, string[]> = new Map();

  // Build mapping of signer -> wallets
  for (const wallet of walletSigners) {
    for (const signer of wallet.signers) {
      const wallets = signerToWallets.get(signer.address) || [];
      wallets.push(wallet.address);
      signerToWallets.set(signer.address, wallets);

      // Update sharedWith
      signer.sharedWith = wallets;
    }
  }

  // Create clusters for shared signers
  let clusterId = 0;
  for (const [signerAddr, wallets] of signerToWallets) {
    if (wallets.length > 1) {
      console.log(`\n🔗 Shared signer found: ${signerAddr.slice(0, 12)}...`);
      console.log(
        `   Controls: ${wallets.map((w) => w.slice(0, 8) + "...").join(", ")}`,
      );

      clusters.push({
        entityId: `signer_cluster_${clusterId++}`,
        wallets: [...wallets, signerAddr],
        relationships: wallets.map((w) => ({
          address: w,
          relation: "Signer" as const,
        })),
        confidenceScore: 95, // High confidence - shared signer = same entity
        primaryWallet: signerAddr,
        description: `Wallets controlled by signer ${signerAddr.slice(0, 8)}...`,
      });
    }
  }

  return clusters;
}

async function discoverHiddenWallets(
  client: NansenClient,
  walletSigners: SignerAnalysis["walletSigners"],
): Promise<SignerAnalysis["hiddenWallets"]> {
  const hiddenWallets: SignerAnalysis["hiddenWallets"] = [];
  const knownAddresses = new Set([
    KEY_WALLETS.root,
    KEY_WALLETS.level1,
    ...KEY_WALLETS.deployers,
  ]);

  // Also add all known signers
  for (const wallet of walletSigners) {
    for (const signer of wallet.signers) {
      knownAddresses.add(signer.address);
    }
  }

  console.log("\n🔍 Searching for hidden wallets...");

  // For each signer, get THEIR related wallets
  const signersToCheck = new Set<string>();
  for (const wallet of walletSigners) {
    for (const signer of wallet.signers) {
      signersToCheck.add(signer.address);
    }
  }

  let checked = 0;
  for (const signerAddr of signersToCheck) {
    if (checked >= 5) {
      console.log("   (Limiting to 5 signer expansions for rate limiting)");
      break;
    }
    checked++;

    console.log(`   Expanding from signer: ${signerAddr.slice(0, 12)}...`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const signerRelated = await client.getRelatedWallets({
      address: signerAddr,
      chain: "solana",
      pagination: { page: 1, per_page: 30 },
    });

    for (const related of signerRelated) {
      if (!knownAddresses.has(related.address)) {
        hiddenWallets.push({
          address: related.address,
          discoveredVia: signerAddr,
          relation: related.relation,
        });
        knownAddresses.add(related.address);
        console.log(
          `     🎯 Hidden wallet: ${related.address.slice(0, 12)}... (${related.relation})`,
        );
      }
    }
  }

  return hiddenWallets;
}

async function main() {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    console.error("❌ NANSEN_API_KEY not found in environment");
    process.exit(1);
  }

  const client = new NansenClient(apiKey);
  console.log("🚀 Starting Signer Analysis");
  console.log("═".repeat(50));

  const walletSigners: SignerAnalysis["walletSigners"] = [];

  // Analyze all key wallets
  const allWallets = [
    { address: KEY_WALLETS.root, role: "root" },
    { address: KEY_WALLETS.level1, role: "level1" },
    ...KEY_WALLETS.deployers.map((addr, i) => ({
      address: addr,
      role: `deployer_${i + 1}`,
    })),
  ];

  for (const wallet of allWallets) {
    const analysis = await analyzeSignersForWallet(
      client,
      wallet.address,
      wallet.role,
    );
    walletSigners.push(analysis);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Find shared signer clusters
  console.log("\n📊 Analyzing shared signers...");
  const sharedSignerClusters = findSharedSignerClusters(walletSigners);

  // Discover hidden wallets
  const hiddenWallets = await discoverHiddenWallets(client, walletSigners);

  // Compile results
  const totalSigners = walletSigners.reduce(
    (sum, w) => sum + w.signers.length,
    0,
  );
  const walletsWithShared = walletSigners.filter((w) =>
    w.signers.some((s) => s.sharedWith.length > 1),
  ).length;

  const analysis: SignerAnalysis = {
    generatedAt: new Date().toISOString(),
    walletSigners,
    sharedSignerClusters,
    hiddenWallets,
    summary: {
      totalSignersFound: totalSigners,
      walletsWithSharedSigners: walletsWithShared,
      hiddenWalletsDiscovered: hiddenWallets.length,
    },
  };

  // Save results
  const outputDir = path.join(process.cwd(), "data", "analysis");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "signer-analysis.json");
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Signer analysis saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log("📊 SIGNER ANALYSIS SUMMARY");
  console.log("═".repeat(50));

  console.log(`\nTotal signers found: ${analysis.summary.totalSignersFound}`);
  console.log(
    `Wallets with shared signers: ${analysis.summary.walletsWithSharedSigners}`,
  );
  console.log(
    `Hidden wallets discovered: ${analysis.summary.hiddenWalletsDiscovered}`,
  );

  console.log("\nShared Signer Clusters:");
  for (const cluster of sharedSignerClusters) {
    console.log(
      `  ${cluster.entityId} (${cluster.confidenceScore}% confidence)`,
    );
    console.log(`    Wallets: ${cluster.wallets.length}`);
    console.log(`    ${cluster.description}`);
  }

  console.log("\nHidden Wallets Found:");
  for (const hidden of hiddenWallets.slice(0, 10)) {
    console.log(`  ${hidden.address.slice(0, 12)}... (${hidden.relation})`);
    console.log(`    Discovered via: ${hidden.discoveredVia.slice(0, 12)}...`);
  }
}

main().catch(console.error);
