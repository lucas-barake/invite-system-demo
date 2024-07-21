import { pipe, Effect, Context, Layer, Data, Cause } from "effect";
import { db } from "@/server/database";
import { DateTime } from "luxon";
import { type Group } from "@/server/api/routers/groups/repository/groups.repository.types";
import { type User } from "@/server/api/routers/user/repository/user.repository.types";

export class DatabaseTransactionError extends Data.TaggedError("DatabaseTransactionError")<{
  cause: unknown;
}> {}

const makeGroupInvitesRepositoryLive = Effect.gen(function* () {
  return {
    hasPendingInviteForEmail: (args: { groupId: Group["id"]; inviteeEmail: User["email"] }) =>
      pipe(
        Effect.tryPromise(() =>
          db
            .selectFrom("group_invites")
            .where(({ eb, and }) =>
              and([
                eb("group_id", "=", args.groupId),
                eb("invitee_email", "=", args.inviteeEmail),
                eb("expiration_time", ">", DateTime.now().toUTC().toJSDate()),
              ])
            )
            .select(["group_id"])
            .executeTakeFirst()
        ),
        Effect.map((invite) => invite !== undefined),
        Effect.withSpan("GroupInvitesRepository.hasPendingInviteForEmail", {
          attributes: {
            groupId: args.groupId,
            inviteeEmail: args.inviteeEmail,
          },
        })
      ),

    isUserAlreadyMemberOfGroup: (args: { groupId: Group["id"]; userEmail: User["email"] }) =>
      pipe(
        Effect.tryPromise(() =>
          db
            .selectFrom("group_members")
            .leftJoin("users", "users.id", "group_members.user_id")
            .where(({ eb, and }) =>
              and([eb("group_id", "=", args.groupId), eb("users.email", "=", args.userEmail)])
            )
            .select("group_members.user_id")
            .executeTakeFirst()
        ),
        Effect.map((user) => user !== undefined),
        Effect.withSpan("GroupInvitesRepository.isUserAlreadyMemberOfGroup", {
          attributes: {
            groupId: args.groupId,
            userEmail: args.userEmail,
          },
        })
      ),

    addMemberToGroupAndRemovePendingInvite: (args: {
      groupId: Group["id"];
      userIdToAdd: User["id"];
      inviteeEmail: User["email"];
    }) =>
      pipe(
        Effect.async<void, DatabaseTransactionError | Cause.NoSuchElementException>((resume) => {
          void db.transaction().execute(async (trx) => {
            try {
              const group = await trx
                .selectFrom("groups")
                .where("id", "=", args.groupId)
                .select(["groups.id"])
                .executeTakeFirst();

              if (group === undefined) {
                resume(Effect.fail(new Cause.NoSuchElementException()));
                return;
              }

              await trx
                .insertInto("group_members")
                .values({
                  group_id: args.groupId,
                  user_id: args.userIdToAdd,
                  updated_at: new Date(),
                })
                .execute();

              await trx
                .deleteFrom("group_invites")
                .where(({ eb, and }) =>
                  and([
                    eb("group_id", "=", args.groupId),
                    eb("invitee_email", "=", args.inviteeEmail),
                  ])
                )
                .execute();

              resume(Effect.void);
            } catch (error) {
              resume(Effect.fail(new DatabaseTransactionError({ cause: error })));
            }
          });
        }),
        Effect.withSpan("GroupInvitesRepository.addMemberToGroupAndRemovePendingInvite", {
          attributes: {
            groupId: args.groupId,
            userIdToAdd: args.userIdToAdd,
            inviteeEmail: args.inviteeEmail,
          },
        })
      ),
  };
});

export class GroupInvitesRepository extends Context.Tag("GroupInvitesRepository")<
  // eslint-disable-next-line no-use-before-define
  GroupInvitesRepository,
  Effect.Effect.Success<typeof makeGroupInvitesRepositoryLive>
>() {
  public static readonly Live = Layer.effect(this, makeGroupInvitesRepositoryLive);
}
