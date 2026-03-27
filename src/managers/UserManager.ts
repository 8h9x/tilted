import { Collection } from "@discordjs/collection";
import Base from "../Base.ts";
import UserNotFoundError from "../exceptions/UserNotFoundError.ts";
import { chunk } from "../util/Util.ts";
import Endpoints from "../resources/Endpoints.ts";
import EpicgamesAPIError from "../exceptions/EpicgamesAPIError.ts";
import { AuthSessionStoreKey } from "../resources/enums.ts";
import UserSearchResult from "../structures/user/UserSearchResult.ts";
import AuthenticationMissingError from "../exceptions/AuthenticationMissingError.ts";
import User from "../structures/user/User.ts";
import Avatar from "../structures/Avatar.ts";
import GlobalProfile from "../structures/GlobalProfile.ts";
import ClientUser from "../structures/user/ClientUser.ts";
import type BlockedUser from "../structures/user/BlockedUser.ts";
import type { UserSearchPlatform } from "../resources/structs.ts";
import type Client from "../Client.ts";

class UserManager extends Base {
  /**
   * The client's blocklist
   */
  public blocklist: Collection<string, BlockedUser>;

  /**
   * The client's user cache
   * @private
   */
  public cache: Collection<string, User & { cachedAt: number }>;

  /**
   * The client's user
   */
  public self?: ClientUser;
  constructor(client: Client) {
    super(client);

    this.blocklist = new Collection();
    this.cache = new Collection();
    this.self = undefined;
  }

  /**
   * Resolves a user's ID from the cache or via the API
   * @param idOrDisplayName The user's ID or display name
   */
  public async resolveId(idOrDisplayName: string): Promise<string> {
    if (idOrDisplayName.length === 32) {
      return idOrDisplayName;
    }

    const cachedUser = this.cache.find(
      (u) => u.displayName === idOrDisplayName,
    );
    if (cachedUser) {
      return cachedUser.id;
    }

    const user = await this.fetch(idOrDisplayName);
    return user.id;
  }

  public async fetch(idOrDisplayName: string): Promise<User> {
    const [user] = await this.fetchMultiple([idOrDisplayName]);

    if (!user) {
      throw new UserNotFoundError(idOrDisplayName);
    }

    return user;
  }

  public async fetchMultiple(idsOrDisplayNames: string[]): Promise<User[]> {
    const ids = [];
    const displayNames = [];

    const users = [];

    for (const idOrDisplayName of idsOrDisplayNames) {
      if (idOrDisplayName.length === 32) {
        const cachedUser = this.cache.get(idOrDisplayName);
        if (cachedUser) {
          const cachedUserClone = new User(this.client, cachedUser.toObject());
          users.push(cachedUserClone);
        } else {
          ids.push(idOrDisplayName);
        }
      } else {
        const cachedUser = this.cache.find(
          (u: any) => u.displayName === idOrDisplayName,
        );
        if (cachedUser) {
          const cachedUserClone = new User(this.client, cachedUser.toObject());
          users.push(cachedUserClone);
        } else {
          displayNames.push(idOrDisplayName);
        }
      }
    }

    const idChunks = chunk(ids, 100);

    const fetchedUserData = await Promise.all([
      ...idChunks.map((c) =>
        this.client.http.epicgamesRequest(
          {
            method: "GET",
            url: `${Endpoints.ACCOUNT_MULTIPLE}?accountId=${
              c.join(
                "&accountId=",
              )
            }`,
          },
          AuthSessionStoreKey.Fortnite,
        )
      ),
      ...displayNames.map((d) =>
        this.client.http
          .epicgamesRequest(
            {
              method: "GET",
              url: `${Endpoints.ACCOUNT_DISPLAYNAME}/${d}`,
            },
            AuthSessionStoreKey.Fortnite,
          )
          .catch((e) => {
            if (
              e instanceof EpicgamesAPIError &&
              e.code === "errors.com.epicgames.account.account_not_found"
            ) {
              return undefined;
            }

            return Promise.reject(e);
          })
      ),
    ]);

    const fetchedUsers = fetchedUserData
      .flat(1)
      .filter((u) => !!u)
      .map((u) => new User(this.client, u));

    if ((this.client.config.cacheSettings.users?.maxLifetime ?? 0) > 0) {
      for (const user of fetchedUsers) {
        const userClone: User & { cachedAt?: number } = new User(
          this.client,
          user.toObject(),
        );
        userClone.cachedAt = Date.now();
        this.cache.set(user.id, userClone as User & { cachedAt: number });
      }
    }

    return [...users, ...fetchedUsers];
  }

  public async fetchSelf() {
    if (!this.client.auth.sessions.has(AuthSessionStoreKey.Fortnite)) {
      throw new AuthenticationMissingError(AuthSessionStoreKey.Fortnite);
    }

    const self = await this.client.http.epicgamesRequest(
      {
        method: "GET",
        url: `${Endpoints.ACCOUNT_ID}/${
          this.client.auth.sessions.get(AuthSessionStoreKey.Fortnite)!.accountId
        }`,
      },
      AuthSessionStoreKey.Fortnite,
    );

    this.self = new ClientUser(this.client, self);
  }

  public async search(
    prefix: string,
    platform: UserSearchPlatform = "epic",
  ): Promise<UserSearchResult[]> {
    const results = await this.client.http.epicgamesRequest(
      {
        method: "GET",
        url: `${Endpoints.ACCOUNT_SEARCH}/${this.self!.id}?prefix=${
          encodeURIComponent(
            prefix,
          )
        }&platform=${platform}`,
      },
      AuthSessionStoreKey.Fortnite,
    );

    const users = await this.fetchMultiple(
      results.map((r: any) => r.accountId) as string[],
    );

    return results
      .filter((r: any) => users.some((u) => u.id === r.accountId))
      .map(
        (r: any) =>
          new UserSearchResult(
            this.client,
            users.find((u) => u.id === r.accountId)!,
            r,
          ),
      );
  }

  /**
   * Fetches the avatar of a user
   * @param user The id or display name of the user
   * @throws {EpicgamesAPIError}
   * @throws {UserNotFoundError} The user wasn't found
   */
  public async fetchAvatar(idOrDisplayName: string): Promise<Avatar> {
    const [avatar] = await this.fetchAvatarMultiple([idOrDisplayName]);

    if (!avatar) {
      throw new UserNotFoundError(idOrDisplayName);
    }

    return avatar;
  }

  /**
   * Fetches the avatar of multiple users
   * @param user The ids and/or display names of the users
   * @throws {EpicgamesAPIError}
   */
  public async fetchAvatarMultiple(
    idsOrDisplayNames: string[],
  ): Promise<Avatar[]> {
    const users = await this.fetchMultiple(idsOrDisplayNames);

    const userChunks = chunk(users, 100);

    const avatars = await Promise.all(
      userChunks.map((uc) =>
        this.client.http.epicgamesRequest(
          {
            method: "GET",
            url: `${Endpoints.ACCOUNT_AVATAR}/fortnite/ids?accountIds=${
              uc
                .map((u) => u.id)
                .join(",")
            }`,
          },
          AuthSessionStoreKey.Fortnite,
        )
      ),
    );

    return avatars
      .map((a) =>
        a.map(
          (ar: any) =>
            new Avatar(
              this.client,
              ar,
              users.find((u) => u.id === ar.accountId)!,
            ),
        )
      )
      .flat(1);
  }

  /**
   * Fetches the global profile of a user
   * @param user The id or display name of the user
   * @throws {EpicgamesAPIError}
   * @throws {UserNotFoundError} The user wasn't found
   */
  public async fetchGlobalProfile(
    idOrDisplayName: string,
  ): Promise<GlobalProfile> {
    const [profile] = await this.fetchGlobalProfileMultiple([idOrDisplayName]);

    if (!profile) {
      throw new UserNotFoundError(idOrDisplayName);
    }

    return profile;
  }

  /**
   * Fetches the global profile for multiple users
   * @param user The ids and/or display names of the users
   * @throws {EpicgamesAPIError}
   */
  public async fetchGlobalProfileMultiple(
    idsOrDisplayNames: string[],
  ): Promise<GlobalProfile[]> {
    const users = await this.fetchMultiple(idsOrDisplayNames);

    const userChunks = chunk(users, 100);

    const globalProfiles = await Promise.all(
      userChunks.map((uc) =>
        this.client.http.epicgamesRequest(
          {
            method: "PUT",
            url: Endpoints.ACCOUNT_GLOBAL_PROFILE,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              namespace: "Fortnite",
              accountIds: uc.map((u) => u.id),
            }),
          },
          AuthSessionStoreKey.Fortnite,
        )
      ),
    );

    return globalProfiles
      .map((a) =>
        a.profiles.map(
          (ar: any) =>
            new GlobalProfile(
              this.client,
              ar,
              users.find((u) => u.id === ar.accountId)!,
            ),
        )
      )
      .flat(1);
  }

  /**
   * Blocks a user
   * @param user The id or display name of the user
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {EpicgamesAPIError}
   */
  public async block(user: string) {
    const userId = await this.resolveId(user);
    if (!userId) throw new UserNotFoundError(user);

    await this.client.http.epicgamesRequest(
      {
        method: "POST",
        url: `${Endpoints.FRIEND_BLOCK}/${this.self!.id}/${userId}`,
      },
      AuthSessionStoreKey.Fortnite,
    );
  }

  /**
   * Unblocks a user
   * @param user The id or display name of the user
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {EpicgamesAPIError}
   */
  public async unblock(user: string) {
    const blockedUser = this.blocklist.find(
      (u) => u.displayName === user || u.id === user,
    );
    if (!blockedUser) throw new UserNotFoundError(user);

    await this.client.http.epicgamesRequest(
      {
        method: "DELETE",
        url: `${Endpoints.FRIEND_BLOCK}/${this.self!.id}/${blockedUser.id}`,
      },
      AuthSessionStoreKey.Fortnite,
    );
  }
}

export default UserManager;
