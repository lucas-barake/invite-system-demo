import {
  type AcceptGroupInviteInputType,
  type SendGroupInviteInputType,
} from "@/server/api/routers/groups/sub-routers/group-invites/group-invites.input";
import { type Session } from "@/server/api/routers/auth/service/auth.service.types";

export type SendGroupInviteArgs = {
  input: SendGroupInviteInputType;
  session: Session;
};

export type AcceptGroupInviteArgs = {
  input: AcceptGroupInviteInputType;
  session: Session;
};

export type DeclineGroupInviteArgs = {
  groupId: string;
  session: Session;
};

export type RemovePendingInviteArgs = {
  groupId: string;
  inviteeEmail: string;
  session: Session;
};

export type GetPendingInvitesForGroupArgs = {
  groupId: string;
  session: Session;
};
