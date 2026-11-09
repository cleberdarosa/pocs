import { secureStorage } from '@/core/storage/secureStorage';
import { AppLogger } from '@/core/utils/appLogger';
import {
  accessTokenIsValid,
  identityAccessTokenIsValid,
  type AuthSession,
  type SessionRestoreResult,
} from '@/models/auth';
import { authService } from '@/services/authService';

const addSeconds = (seconds: number) => new Date(Date.now() + seconds * 1000);

/**
 * Instância única (singleton) para que a sessão em memória e o refresh em
 * andamento sejam compartilhados por toda a aplicação.
 */
class AuthRepository {
  private session: AuthSession | null = null;
  private refreshInProgress: Promise<AuthSession | null> | null = null;

  get currentSession() {
    return this.session;
  }

  async login(cpf: string, senha: string): Promise<AuthSession> {
    AppLogger.session('Iniciando novo login.');

    try {
      const authorization = await authService.authorization(cpf, senha);
      AppLogger.session('Autorização inicial concluída. Solicitando token principal.');

      const token = await authService.accessToken(authorization.code, authorization.accessToken);

      const session: AuthSession = {
        identityAccessToken: authorization.accessToken,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        identityAccessTokenExpiresAt: addSeconds(authorization.expiresIn),
        accessTokenExpiresAt: addSeconds(token.expiresIn),
        cpf,
      };

      AppLogger.session(
        `Sessão criada. Access token válido até ${session.accessTokenExpiresAt.toLocaleString()}.`,
      );

      await secureStorage.saveSession(session);
      this.session = session;
      AppLogger.session('Sessão salva com sucesso no armazenamento seguro.');

      return session;
    } catch (error) {
      AppLogger.error('SESSION', 'Falha ao criar a sessão durante o login.', error);
      throw error;
    }
  }

  async restoreSession(): Promise<SessionRestoreResult> {
    AppLogger.session('Iniciando restauração da sessão.');

    try {
      const session = await secureStorage.getSession();

      if (!session) {
        AppLogger.session('Nenhuma sessão completa encontrada no armazenamento.');
        this.session = null;
        return 'unauthenticated';
      }

      AppLogger.session('Sessão encontrada no armazenamento seguro.');
      this.session = session;

      if (accessTokenIsValid(session)) {
        AppLogger.session('Access token ainda está válido. Refresh não necessário.');
        return 'authenticated';
      }

      AppLogger.session('Access token vencido ou próximo do vencimento. Iniciando refresh.');
      const refreshed = await this.refreshSession(session);

      if (!refreshed) {
        AppLogger.session('Não foi possível renovar a sessão.');
        return 'unauthenticated';
      }

      AppLogger.session('Sessão renovada com sucesso.');
      return 'authenticated';
    } catch (error) {
      AppLogger.error('SESSION', 'Erro durante a restauração da sessão.', error);
      await this.logout();
      return 'unauthenticated';
    }
  }

  /** Garante que apenas um refresh rode por vez; chamadas concorrentes aguardam o mesmo. */
  refreshSession(session?: AuthSession | null): Promise<AuthSession | null> {
    if (this.refreshInProgress) {
      AppLogger.session('Já existe um refresh em andamento. Aguardando a mesma operação.');
      return this.refreshInProgress;
    }

    AppLogger.session('Nenhum refresh em andamento. Criando nova operação.');

    this.refreshInProgress = this.performRefresh(session ?? null).finally(() => {
      AppLogger.session('Operação de refresh finalizada.');
      this.refreshInProgress = null;
    });

    return this.refreshInProgress;
  }

  private async performRefresh(provided: AuthSession | null): Promise<AuthSession | null> {
    try {
      const session = provided ?? this.session ?? (await secureStorage.getSession());

      if (!session) {
        AppLogger.session('Refresh cancelado porque não existe sessão.');
        await this.logout();
        return null;
      }

      if (!identityAccessTokenIsValid(session)) {
        AppLogger.session('Refresh cancelado porque o token de identidade expirou.');
        await this.logout();
        return null;
      }

      AppLogger.session('Token de identidade válido. Chamando API de refresh.');
      const token = await authService.refreshToken(
        session.refreshToken,
        session.identityAccessToken,
      );

      const refreshed: AuthSession = {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        accessTokenExpiresAt: addSeconds(token.expiresIn),
      };

      await secureStorage.saveSession(refreshed);
      this.session = refreshed;

      AppLogger.session(
        `Tokens rotacionados e sessão atualizada. Nova validade: ${refreshed.accessTokenExpiresAt.toLocaleString()}.`,
      );

      return refreshed;
    } catch (error) {
      AppLogger.error('SESSION', 'Refresh da sessão falhou.', error);
      await this.logout();
      return null;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    AppLogger.session('Solicitado um access token válido.');

    const session = this.session ?? (await secureStorage.getSession());

    if (!session) {
      AppLogger.session('Não existe sessão disponível para fornecer o token.');
      return null;
    }

    if (accessTokenIsValid(session)) {
      AppLogger.session('Access token atual está válido.');
      this.session = session;
      return session.accessToken;
    }

    AppLogger.session('Access token não está válido. Solicitando refresh.');
    const refreshed = await this.refreshSession(session);

    if (!refreshed) {
      AppLogger.session('Não foi possível obter um access token válido.');
      return null;
    }

    AppLogger.session('Novo access token disponível depois do refresh.');
    return refreshed.accessToken;
  }

  async logout(): Promise<void> {
    AppLogger.session('Limpando sessão local.');
    this.session = null;
    await secureStorage.clear();
    AppLogger.session('Sessão local removida.');
  }
}

export const authRepository = new AuthRepository();
