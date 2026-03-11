import { HmppsUser } from '../../interfaces/hmppsUser'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
  }
}

declare module 'express-serve-static-core' {
  interface IRouter {
    redirect(from: string, destination: string, statusCode?: number): this
    render(path: string, view: string, options?: object): this
    markdown(routePath: string, markdownFile: string): this
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: HmppsUser
    }
  }
}
