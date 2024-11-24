import { lazy } from 'react'
import { App } from './App'
import {
  createBrowserRouter,
  createHashRouter,
  Outlet,
  redirect,
  RouterProvider,
} from 'react-router-dom'
import { ErrorPage } from './components/ErrorPage'
import { Settings } from './routes/Settings'
import { Telemetry } from './routes/Telemetry'
import Onboarding, { onboardingRoutes } from './routes/Onboarding'
import SignIn from './routes/SignIn'
import { Auth } from './Auth'
import { isDesktop } from './lib/isDesktop'
import Home from './routes/Home'
import { NetworkContext } from './hooks/useNetworkContext'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import makeUrlPathRelative from './lib/makeUrlPathRelative'
import DownloadAppBanner from 'components/DownloadAppBanner'
import { WasmErrBanner } from 'components/WasmErrBanner'
import { CommandBar } from 'components/CommandBar/CommandBar'
import ModelingMachineProvider from 'components/ModelingMachineProvider'
import FileMachineProvider from 'components/FileMachineProvider'
import { MachineManagerProvider } from 'components/MachineManagerProvider'
import { PATHS } from 'lib/paths'
import {
  fileLoader,
  homeLoader,
  onboardingRedirectLoader,
  settingsLoader,
  telemetryLoader,
} from 'lib/routeLoaders'
import { CommandBarProvider } from 'components/CommandBar/CommandBarProvider'
import SettingsAuthProvider from 'components/SettingsAuthProvider'
import LspProvider from 'components/LspProvider'
import { KclContextProvider } from 'lang/KclProvider'
import { BROWSER_PROJECT_NAME } from 'lib/constants'
import { AppStateProvider } from 'AppState'
import { RouteProvider } from 'components/RouteProvider'
import { ProjectsContextProvider } from 'components/ProjectsContextProvider'

const LazyCoreDump = lazy(() => import('./CoreDump'))

const createRouter = isDesktop() ? createHashRouter : createBrowserRouter

const router = createRouter([
  {
    loader: settingsLoader,
    id: PATHS.INDEX,
    // TODO: Re-evaluate if this is true
    /* Make sure auth is the outermost provider or else we will have
     * inefficient re-renders, use the react profiler to see. */
    element: (
      <CommandBarProvider>
        <RouteProvider>
          <SettingsAuthProvider>
            <LspProvider>
              <ProjectsContextProvider>
                <KclContextProvider>
                  <AppStateProvider>
                    <MachineManagerProvider>
                      <Outlet />
                    </MachineManagerProvider>
                  </AppStateProvider>
                </KclContextProvider>
              </ProjectsContextProvider>
            </LspProvider>
          </SettingsAuthProvider>
        </RouteProvider>
      </CommandBarProvider>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: PATHS.INDEX,
        loader: async () => {
          const onDesktop = isDesktop()
          return onDesktop
            ? redirect(PATHS.HOME)
            : redirect(PATHS.FILE + '/%2F' + BROWSER_PROJECT_NAME)
        },
      },
      {
        loader: fileLoader,
        id: PATHS.FILE,
        path: PATHS.FILE + '/:id',
        element: (
          <Auth>
            <FileMachineProvider>
              <ModelingMachineProvider>
                <LazyCoreDump />
                <Outlet />
                <App />
                <CommandBar />
                {
                  // @ts-ignore
                  !isDesktop() && import.meta.env.PROD && <DownloadAppBanner />
                }
              </ModelingMachineProvider>
              <WasmErrBanner />
            </FileMachineProvider>
          </Auth>
        ),
        children: [
          {
            id: PATHS.FILE + 'SETTINGS',
            loader: settingsLoader,
            children: [
              {
                loader: onboardingRedirectLoader,
                index: true,
                element: <></>,
              },
              {
                path: makeUrlPathRelative(PATHS.SETTINGS),
                element: <Settings />,
              },
              {
                path: makeUrlPathRelative(PATHS.ONBOARDING.INDEX),
                element: <Onboarding />,
                children: onboardingRoutes,
              },
            ],
          },
          {
            id: PATHS.FILE + 'TELEMETRY',
            loader: telemetryLoader,
            children: [
              {
                path: makeUrlPathRelative(PATHS.TELEMETRY),
                element: <Telemetry />,
              },
            ],
          },
        ],
      },
      {
        path: PATHS.HOME,
        element: (
          <Auth>
            <Outlet />
            <Home />
            <CommandBar />
          </Auth>
        ),
        id: PATHS.HOME,
        loader: homeLoader,
        children: [
          {
            index: true,
            element: <></>,
            id: PATHS.HOME + 'SETTINGS',
            loader: settingsLoader,
          },
          {
            path: makeUrlPathRelative(PATHS.SETTINGS),
            loader: settingsLoader,
            element: <Settings />,
          },
          {
            path: makeUrlPathRelative(PATHS.TELEMETRY),
            loader: telemetryLoader,
            element: <Telemetry />,
          },
        ],
      },
      {
        path: PATHS.SIGN_IN,
        element: <SignIn />,
      },
    ],
  },
])

/**
 * All routes in the app, used in src/index.tsx
 * @returns RouterProvider
 */
export const Router = () => {
  const networkStatus = useNetworkStatus()

  return (
    <NetworkContext.Provider value={networkStatus}>
      <RouterProvider router={router} />
    </NetworkContext.Provider>
  )
}
