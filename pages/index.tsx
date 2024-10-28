import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Hit as AlgoliaHit } from 'instantsearch.js';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import singletonRouter from 'next/router';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  DynamicWidgets,
  InstantSearch,
  Hits,
  Highlight,
  RefinementList,
  SearchBox,
  InstantSearchServerState,
  InstantSearchSSRProvider,
  getServerState,
  Pagination,
  HitsPerPage,
  ClearRefinements,
  CurrentRefinements,
  Stats,
  SortBy
} from 'react-instantsearch';
import { createInstantSearchRouterNext } from 'react-instantsearch-router-nextjs';

import { Panel } from '../components/Panel';

const client = algoliasearch('latency', '6be0576ff61c053d5f9a3225e2a90f76');

type HitProps = {
  hit: AlgoliaHit<{
    name: string;
    price: number;
  }>;
};

function Hit({ hit }: HitProps) {
  return (
    <>
      <Highlight hit={hit} attribute="name" className="Hit-label" />
      <span className="Hit-price">${hit.price}</span>
    </>
  );
}

type HomePageProps = {
  serverState?: InstantSearchServerState;
  url?: string;
};

export default function HomePage({ serverState, url }: HomePageProps) {
  return (
    <InstantSearchSSRProvider {...serverState}>
      <Head>
        <title>Algolia InstantSearch - Next.js</title>
      </Head>

      <InstantSearch
        searchClient={client}
        indexName="instant_search"
        routing={{
          router: createInstantSearchRouterNext({
            serverUrl: url,
            singletonRouter,
            routerOptions: {
              cleanUrlOnDispose: false,
            },
          }),
        }}
        insights={true}
      >
        <div className='grid items-start grid-cols-5 gap-2'>
          <div className='col-span-1'>
            <CurrentRefinements
              classNames={{
                list: '!block',
                item: 'w-full mb-2 !block',
                label: 'block',
                category: '!ml-0 flex items-center justify-between text-slate-400'
              }}
            />
            <ClearRefinements
              classNames={{
                root: 'mb-4'
              }}
            />
            <DynamicWidgets fallbackComponent={FallbackComponent} />
          </div>
          <div className='col-span-4'>
            <div className='flex items-center justify-between'>
              <Stats
                translations={{
                  rootElementText({ nbHits }) {
                    return `${nbHits.toLocaleString()} Products`;
                  }
                }}
              />
              <SortBy
                items={[
                  { label: 'Relevance', value: 'instant_search' },
                  { label: 'Price (asc)', value: 'instant_search_price_asc' },
                  { label: 'Price (desc)', value: 'instant_search_price_desc' },
                ]}
              />
            </div>
          
          <SearchBox
              placeholder={'Search catalog by sku or keywords...'}
              classNames={{
                root: 'my-6'
              }}
              resetIconComponent={({ classNames }) => (
                <div className={classNames.resetIcon}>CLEAR</div>
              )}
            />
            <Hits 
              classNames={{
                list: 'grid grid-cols-4',
                item: ''
              }}
              hitComponent={Hit}
            />
            
            <div className='flex items-center justify-between my-6 relative w-full'>
              <Pagination
                padding={2}
                showLast={false}
                showFirst={false}
              />  
              <HitsPerPage 
                items={[
                  { label: '20', value: 20, default: true },
                  { label: '40', value: 40 },
                  { label: '60', value: 60 }
                ]}
                classNames={{
                  select: 'appearance-none'
                }}
              />
            </div>
          </div>
        </div>
      </InstantSearch>
    </InstantSearchSSRProvider>
  );
}

function FallbackComponent({ attribute }: { attribute: string }) {
  return (
    <Panel 
      header={attribute}
    >
      <RefinementList 
        attribute={attribute}
        showMore={true}
        limit={8}
        searchable={true}
        searchablePlaceholder={'Search for other ...'}
        sortBy={['name:asc']}
        classNames={{
          root: 'MyCustomRefinementList',
          showMore: '!bg-transparent !border-0 !p-0 !text-primary !shadow-none !underline hover:!no-underline',
        }}
      />
    </Panel>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> =
  async function getServerSideProps({ req }) {
    const protocol = req.headers.referer?.split('://')[0] || 'https';
    const url = `${protocol}://${req.headers.host}${req.url}`;
    const serverState = await getServerState(<HomePage url={url} />, {
      renderToString,
    });

    return {
      props: {
        serverState,
        url,
      },
    };
  };
