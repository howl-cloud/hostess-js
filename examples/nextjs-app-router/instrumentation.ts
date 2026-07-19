// Server-side Hostess instrumentation, from the dedicated server entry so no
// client code is pulled into this Node/edge bundle.
export { register, onRequestError } from "@hostess/nextjs/server";
