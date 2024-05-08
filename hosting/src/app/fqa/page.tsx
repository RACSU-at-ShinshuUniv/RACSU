/** @jsxImportSource @emotion/react */
"use client";

import { css } from '@emotion/react';
import { Box } from '@mui/material';
import Paragraph, { Title, Index, Content, Description } from "@/common/component/Paragraph";
import Link from 'next/link';

const style = {
  main: css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `
}

export default function App() {
  return (
    <main css={style.main}>
      <Box width="80vw" padding="20px 0">
        <Paragraph>
          <Title>RACSUの利用・運営について</Title>
          <Index>Q. RACSUは無料で使えますか</Index>
          <Content>広告表示等なしで、全ての機能を無料でお使いいただけます。</Content>
          <Content>今後、有料サービスに変更する予定もありません。</Content>

          <Index>Q. 使い方がわかりません</Index>
          <Content><Link href="/usage/">使い方のページ</Link>に従って、拡張機能のインストールと初期設定を行ってください。</Content>

          <Index>Q. 運営に問い合わせたいです</Index>
          <Content>racsu.shinshu-univ[at]gmail.comへメールでお問い合わせください。</Content>
        </Paragraph>
        <Paragraph>
          <Title>RACSUの機能について</Title>
          <Index>Q. RACSUの課題は自動でeAlpsと同期されますか</Index>
          <Content>インストールしたブラウザを起動中に、10分毎に自動で更新します。</Content>
          <Content>手動で任意のタイミングで同期することも可能です。</Content>
          <Content>詳しくは<Link href="/usage/">使い方のページ</Link>をご覧ください。</Content>

          <Index>Q. リストに表示されない課題があります</Index>
          <Content>eALPS上で提出締切が設定されていないものや、eALPS以外の提出方法の課題は自動取得できません。</Content>
          <Content>課題リスト右下の＋ボタンより、手動で追加することができます。</Content>

          <Index>Q. 提出済みの課題は表示しないでほしいです</Index>
          <Content>eALPSのシステム上、自動で課題の提出状況を取得することができません。</Content>

          <Index>Q. こんな新しい機能がほしい！・バグを見つけた</Index>
          <Content>ご意見・ご要望大歓迎です。ぜひお待ちしております。</Content>
          <Content>racsu.shinshu-univ[at]gmail.comへメールでお問い合わせください。</Content>
        </Paragraph>
      </Box>
    </main>
  );
}
