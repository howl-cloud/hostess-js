// Server instrumentation entry (Node/edge only). Kept separate from the root
// so OTel/Node code never lands in a client bundle.
export { register } from "./register";
export { onRequestError } from "./on-request-error";
export { SDK_VERSION } from "./version";
