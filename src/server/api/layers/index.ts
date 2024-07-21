import { Layer, ManagedRuntime } from "effect";
import { GroupInvitesRepository } from "./group-invites/group-invites.repository";
import { GroupInvitesService } from "./group-invites/group-invites.service";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSdk } from "@effect/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: "invite-system-demo" },
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: "http://localhost:4318/v1/traces", // Tempo OTLP HTTP endpoint
    })
  ),
  metricReader: new PrometheusExporter({
    port: 9464, // the port where metrics will be exposed
  }),
  instrumentations: [getNodeAutoInstrumentations()],
}));

export const ServerRuntime = ManagedRuntime.make(
  Layer.mergeAll(GroupInvitesRepository.Live, GroupInvitesService.Live, NodeSdkLive)
);

export * from "./group-invites";
export * from "./session-context";
