import { KmsSigner } from "@planetarium/aws-kms-provider";
import { Configuration } from "./configuration";
import { HeadlessGraphQLClient } from "./headless-graphql-client";
import { KMSNCGSigner } from "./kms-ncg-signer";
import crypto from "crypto";

const ACTION = "ACTIVATE_ACCOUNT_PLAIN_VALUE";
const headlessGraphQLClient = new HeadlessGraphQLClient(Configuration.get("GRAPHQL_API_ENDPOINT"));

const kmsSigner = new KmsSigner(Configuration.get("KMS_PROVIDER_REGION"), Configuration.get("KMS_PROVIDER_KEY_ID"), {
    accessKeyId: Configuration.get("KMS_PROVIDER_AWS_ACCESSKEY"),
    secretAccessKey: Configuration.get("KMS_PROVIDER_AWS_SECRETKEY"),
});

const kmsNcgSigner = new KMSNCGSigner(Configuration.get("KMS_PROVIDER_REGION"), Configuration.get("KMS_PROVIDER_KEY_ID"), {
    accessKeyId: Configuration.get("KMS_PROVIDER_AWS_ACCESSKEY"),
    secretAccessKey: Configuration.get("KMS_PROVIDER_AWS_SECRETKEY"),
});

async function main() {
    const publicKeyBuffer = await kmsSigner.getPublicKey();
    const publicKey = publicKeyBuffer.slice(23).toString("base64");
    console.log(publicKey);

    const unsignedTx = await headlessGraphQLClient.createUnsignedTx(ACTION, publicKey);
    const unsignedTxId = crypto.createHash('sha256').update(unsignedTx, 'base64').digest();
    const signatureBuffer = await kmsNcgSigner.sign(unsignedTxId);
    const signature = signatureBuffer.toString("base64")

    const signedTx = await headlessGraphQLClient.attachSignature(unsignedTx, signature);
    console.log(signedTx);
    await headlessGraphQLClient.stageTx(signedTx);
}

main().then(console.log).catch(console.error);
