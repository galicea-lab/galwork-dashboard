import Head from 'next/head'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { DictionaryProvider } from '@galicea-lab/rjsf-widgets'
import { dictionariesApi } from '@/api/dictionaries'
import CONFIG from '@/configs/config'

// Component Imports
import TailwindLayout from '@/layouts/TailwindLayout'
import { AuthProvider } from '@galicea-lab/nextjs-keycloak-auth'

// Global css styles
import '@/styles/globals.css'
// 2026-11-18: warstwa wyglądu do zmian przy wdrożeniu (musi być po Tailwindzie).
import '@/styles/custom.css'

// Extend App Props
type ExtendedAppProps = AppProps & {
  Component: NextPage & {
    getLayout?: (page: React.ReactElement) => React.ReactNode
  }
}

const App = (props: ExtendedAppProps) => {
  const { Component, pageProps } = props

  // Variables
  const getLayout = Component.getLayout ?? ((page: React.ReactElement) => <TailwindLayout>{page}</TailwindLayout>)

  return (
    <Provider store={store}>
      <AuthProvider keycloakConfig={{ keycloak: CONFIG.keycloak, keycloak_client: CONFIG.keycloak_client }}>
        <DictionaryProvider fetchOptions={dictionariesApi.listOptions}>
          <Head>
            <title>{CONFIG.app_name}</title>
            <meta
              name='description'
              content={`${CONFIG.app_name} - workflow, zadania, regulacje i procesy`}
            />
            <meta name='keywords' content='Workflow, BPMN, Tasks, Processes' />
            <meta name='viewport' content='initial-scale=1, width=device-width' />
          </Head>
          {getLayout(<Component {...pageProps} />)}
        </DictionaryProvider>
      </AuthProvider>
    </Provider>
  )
}

export default App