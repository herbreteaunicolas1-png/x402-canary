import test from "node:test";
import assert from "node:assert/strict";
import { x402Health } from "../src/x402-health.ts";

const payment = { x402Version:2, resource:{url:"https://api.example.com/paid"}, accepts:[{scheme:"exact",network:"eip155:8453",amount:"10000",asset:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",payTo:"0x1111111111111111111111111111111111111111",maxTimeoutSeconds:60}], extensions:{bazaar:{info:{}}} };
const enc = Buffer.from(JSON.stringify(payment)).toString("base64");

test("x402 health never pays target and recognizes v2 Base USDC", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{url:string, init:any}> = [];
  globalThis.fetch = (async (input:any, init:any={}) => {
    const url=String(input); calls.push({url,init});
    if (url.includes("cloudflare-dns.com")) return new Response(JSON.stringify({Answer:[{data:"93.184.216.34"}]}),{status:200,headers:{"content-type":"application/dns-json"}});
    return new Response("",{status:402,headers:{"payment-required":enc}});
  }) as any;
  try {
    const r=await x402Health("https://api.example.com/paid","GET");
    assert.equal(r.data.protocol_valid,true);
    assert.equal(r.data.base_mainnet,true);
    assert.equal(r.data.canonical_base_usdc,true);
    assert.equal(r.data.resource_matches_target,true);
    assert.equal(r.data.bazaar_declared,true);
    assert.equal(r.data.paid_target,false);
    const target=calls.find(c=>c.url==="https://api.example.com/paid");
    assert.ok(target);
    assert.equal(target!.init.headers["payment-signature"],undefined);
  } finally { globalThis.fetch=originalFetch; }
});

test("x402 health fails closed on private DNS resolution", async () => {
  const originalFetch=globalThis.fetch;
  globalThis.fetch = (async (input:any) => {
    const url=String(input);
    if (url.includes("cloudflare-dns.com")) return new Response(JSON.stringify({Answer:[{data:"10.0.0.7"}]}),{status:200});
    throw new Error("target fetch must not execute");
  }) as any;
  try { await assert.rejects(()=>x402Health("https://example.com/paid","GET"),/private_or_local_url/); }
  finally { globalThis.fetch=originalFetch; }
});

test("x402 health rejects non-443 and IP-literal targets before fetch", async () => {
  await assert.rejects(() => x402Health("https://example.com:8443/pay", "GET"), /https_443_required/);
  await assert.rejects(() => x402Health("https://8.8.8.8/pay", "GET"), /hostname_required/);
});
