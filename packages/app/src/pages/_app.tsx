import { StylesProvider } from '@material-ui/core/styles';
import App from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import React from 'react';
import * as gtag from '../libs/gtag';
import { ThemeContainer } from '../store/theme';

Router.events.on('routeChangeComplete', (url) => {
  gtag.pageview(url);
});

export default class MyApp extends App {
  static async getInitialProps(ctx: any): Promise<any> {
    if (ctx.Component.getInitialProps) {
      const pageProps = await ctx.Component.getInitialProps(ctx);
      return { pageProps };
    }
    return {};
  }

  render(): JSX.Element {
    const { Component, pageProps } = this.props;

    return (
      <ThemeContainer.Provider>
        <StylesProvider injectFirst>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </Head>
          <Component {...pageProps} />
        </StylesProvider>
      </ThemeContainer.Provider>
    );
  }
}
