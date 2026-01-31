import { Prisma } from "@prisma/client";

export type MemberWithRelations = Prisma.MemberGetPayload<{
  include: {
    branch: true;
    tenant: true;
    CommunityMember: {
      include: {
        community: true;
      };
    };
    user: {
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    member: {
      include: {
        branch: true;
        tenant: true;
        CommunityMember: {
          include: {
            community: true;
          };
        };
      };
    };
    tenant: true;
    roleAssignments: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;
