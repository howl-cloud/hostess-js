// Bumped in lockstep with package.json on release. Surfaces server-side in the
// OTel resource and client-side in the beacon `sdk` field as `nextjs@<version>`.
//
// This module is a bare constant on purpose: it is shared by both the server
// entry and the `"use client"` components, so it must stay free of any
// server-only code (e.g. `require`) that would otherwise be dragged across the
// client boundary. Server-only version probing lives in `./next-version`.
export const SDK_VERSION = "0.2.0";
