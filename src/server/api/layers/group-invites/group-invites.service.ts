import { pipe, Effect, Context, Layer } from "effect";
import { type AcceptGroupInviteInputType } from "@/server/api/routers/groups/sub-routers/group-invites/group-invites.input";
import { GroupInvitesRepository } from "./group-invites.repository";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { SessionContext } from "../session-context";
import { TRPCError } from "@trpc/server";

const makeGroupInvitesServiceLive = Effect.gen(function* () {
  const groupinvitesRepository = yield* GroupInvitesRepository;

  return {
    acceptGroupInvite: (input: AcceptGroupInviteInputType) =>
      pipe(
        Effect.gen(function* () {
          const session = yield* SessionContext;

          yield* Effect.logInfo("Accepting group invite", {
            groupId: input.groupId,
            userEmail: session.user.email,
          });

          const pendingInviteAlreadyExists = yield* groupinvitesRepository.hasPendingInviteForEmail(
            {
              groupId: input.groupId,
              inviteeEmail: session.user.email,
            }
          );
          if (!pendingInviteAlreadyExists) {
            return Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message: "No pending invite found",
              })
            );
          }

          const memberAlreadyExists = yield* groupinvitesRepository.isUserAlreadyMemberOfGroup({
            groupId: input.groupId,
            userEmail: session.user.email,
          });
          if (memberAlreadyExists) {
            return Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message: "You are already a member of this group",
              })
            );
          }

          return yield* pipe(
            groupinvitesRepository.addMemberToGroupAndRemovePendingInvite({
              groupId: input.groupId,
              userIdToAdd: session.user.id,
              inviteeEmail: session.user.email,
            }),
            Effect.andThen(Effect.logInfo("Group invite accepted for user:", session.user.email)),
            Effect.catchTags({
              DatabaseTransactionError: () =>
                Effect.fail(
                  new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to add member to group and remove pending invite",
                  })
                ),
              NoSuchElementException: () =>
                Effect.fail(
                  new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No pending invite found",
                  })
                ),
            }),
            Effect.withSpan("GroupInvitesService.acceptGroupInvite", {
              attributes: {
                groupId: input.groupId,
                userEmail: session.user.email,
              },
            })
          );
        })
      ),
  };
});

export class GroupInvitesService extends Context.Tag("GroupInvitesService")<
  // eslint-disable-next-line no-use-before-define
  GroupInvitesService,
  Effect.Effect.Success<typeof makeGroupInvitesServiceLive>
>() {
  public static readonly Live = Layer.effect(this, makeGroupInvitesServiceLive).pipe(
    Layer.provide(GroupInvitesRepository.Live)
  );
}
