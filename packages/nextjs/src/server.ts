// @hostess/nextjs/server — server instrumentation entry (Node/edge only, no
// React, no client code).
//
//     // instrumentation.ts
//     export { register, onRequestError } from "@hostess/nextjs/server";
//
// Kept separate from the root so it never drags OTel/Node code into a client
// bundle, and so the root can be a pure `"use client"` module (which is what
// makes the components work in the Pages Router). See the README for why a
// single combined entry is not possible.

export { register } from "./register";
export { onRequestError } from "./on-request-error";
export { SDK_VERSION } from "./version";
