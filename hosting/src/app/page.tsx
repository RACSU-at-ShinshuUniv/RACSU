/** @jsxImportSource @emotion/react */
"use client";

import React from 'react'

import { css } from '@emotion/react';
import { Box, Button } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';

import color from "@/color.json"
import url from "@/url.json";

import MockTaskList from '@/components/MockTaskList';
import Paragraph, { Title, Index, Content, Description } from "@/components/Paragraph";

const style = {
  main: css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `,

  top: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: ${color.blue};
    color: #ffffff;
    padding: 50px 5vw 50px 5vw;
    width: 100%;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;

    @media screen and (min-width:1000px) {
      flex-direction: row;
      justify-content: center;
    }
  `,

  top_text: css`
    display: flex;
    flex-direction: column;
    margin-right: 0;
    @media screen and (min-width:1000px) {
      margin-right: 30px;
    }
  `,

  top_button: css`
  background-color: #ffffff;
  color: ${color.text};
  margin: 20px auto 0 0;
  padding: 8px 25px;

  &:hover {
    background-color: #e6e6e6;
  }

  .MuiSvgIcon-root {
    color: ${color.text};
  }
  `,

  top_text_title: css`
    display: flex;
    align-items: flex-end;
    width: fit-content;
    position: relative;

    & h1 {
      font-size: 37px;
      font-weight: normal;
      margin: 0;
    }

    & p {
      font-size: 20px;
      margin-bottom: 5px;
      margin-left: 6px;
      overflow: visible;
    }

    &::before {
      position: absolute;
      bottom: 0;
      content: '';
      width: calc(100% + 50px);
      border-bottom: 2px solid #ffffff;
      transform: translateX(-5px);
    }
  `,

  top_text_description: css`
    text-align: start;
    margin-top: 20px;
    margin-right: 0;
    @media screen and (min-width:1000px) {
      margin-right: 5vw
    }

    & h1 {
      font-size: 22px;
      margin-bottom: 20px;
    }

    & p {
      font-size: 16px;
      margin-top: 2px;
    }

    span {
      display: inline-block;
    }
  `,

  notify: css`
    background-color: #ffffff;
    color: #000000;
    border: 1px solid #000000;
    border-radius: 8px;
    padding: 10px 20px;
    margin: 50px 10px;

    h1 {
      font-size: 17px;
      border-bottom: 2px solid ${color.blue};
    }

    h1 + p {
      margin-top: 8px;
    }

    span {
      display: inline-block;
    }

    @media screen and (max-width:1000px) {
      margin: 20px 10px;
    }
  `
}

export default function App() {
  return (
    <main css={style.main}>
      <Box css={style.top}>
        <Box css={style.top_text}>
          <Box css={style.top_text_title}>
            <h1>RACSU</h1>
            <p>for eALPS</p>
          </Box>
          <Box css={style.top_text_description}>
            <h1><span>気づかない間に、</span><span>提出期限を過ぎていた…</span></h1>
            <p><span>そんなことになる前に、</span><span>RACSUを使ってみませんか？</span></p>
            <p><span>RACSU for eALPSは、eALPSと連携して</span><br /><span>提出期限がある課題を取得・一覧表示します。</span></p>
          </Box>
          <Button css={style.top_button} target="_blank" href={url.store} variant='contained' endIcon={<LaunchIcon />}>ブラウザにインストール</Button>
        </Box>
        <Box marginTop="30px">
          <MockTaskList />
        </Box>
      </Box>
      <Box css={style.notify}>
        <h1><span>信州大学e-Learningセンター</span> <span>eALPS支援ツール認定事案</span></h1>
        <p>RACSU for eALPSは、信州大学e-Learningセンターの認定を受け、<br />オープンソース（Apache-2.0 License）で開発中です。</p>
        <p>Githubリポジトリは<a href={url.github}>こちら</a>。</p>
      </Box>
      <Box marginX="10vw" marginBottom="40px">
        <Paragraph>
          <Title>RACSU for eALPSとは？</Title>
          <Index><span>RACSU for eALPSは、</span><span>eALPS上で課された課題を自動で取得し、eALPSポータルに一覧表示する拡張機能です。</span></Index>
          <Description>eALPSシステムのカレンダーエクスポート機能を用いて、RACSUが課題を自動取得・一覧表示します。</Description>
        </Paragraph>
        <Paragraph>
          <Title>対応ブラウザ</Title>
          <Index><span>PC版Chrome/Edgeで</span><span>動作確認済み</span></Index>
          <Description>その他Chromiumベースのブラウザでインストール可能です。</Description>
          <Description>Chrome以外のブラウザでご利用の際は、Chromeウェブストアからの拡張機能のインストールを許可してください。</Description>
        </Paragraph>
        <Paragraph>
          <Title>共同開発者募集中！</Title>
          <Description>RACSU for eALPSは信州大学に在学中の学生によって開発・運営されています。</Description>
          <Description>共同開発者を募集中です。一緒に開発しませんか？</Description>
          <Description>詳しくはracsu.shinshu-univ[at]gmail.comまでお問い合わせください！</Description>
        </Paragraph>
      </Box>

    </main>
  );
}
