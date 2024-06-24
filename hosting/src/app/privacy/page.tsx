/** @jsxImportSource @emotion/react */
"use client";

import { css } from '@emotion/react';
import { Box } from '@mui/material';
import Paragraph, { Title, Index, Content, Description } from "@/components/Paragraph";

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
          <Title>プライバシーポリシー（個人情報保護方針）</Title>
          <Description>「RACSU 信大課題リマインダ」（以下、本サービスという）は、ユーザーの個人情報について以下のとおりプライバシーポリシー（以下、「本ポリシー」という）を定めます。</Description>
          <Description>本ポリシーは、本サービスがどのような個人情報を取得し、どのように利用するかを説明するものです。本ポリシーは、利用者と本サービスの利用に関わる一切の関係に適用されるものとします。</Description>

          <Index>・本サービスが取得する情報と利用目的</Index>
          <Content>サービス運営のために、以下の情報を収集します。</Content>
          <Content>これらの情報はサービス利用者のPC内部に保存され、外部サーバーには送信されません。</Content>
          <Content>・共通教育、学部教育のカレンダーエクスポートURL：eALPSからの課題の取得に利用されます。</Content>
          <Content>・課題の詳細：一覧表示の際に利用します。</Content>

          <Index>・課題の取得方法</Index>
          <Content>ユーザーから取得したカレンダーエクスポートURLより、課題の詳細を取得し処理します。</Content>

          <Index>・情報の取り扱いと安全性への措置</Index>
          <Content>取得したカレンダーエクスポートURL・課題データはすべて利用者のPC内部に保存され、外部には送信されません。</Content>
          <Content>取得した情報は、本サービス運営の目的のみで使用され、他のサービス等に販売、転送することはありません。</Content>

          <Index>・サービス退会について</Index>
          <Content>本サービスの拡張機能をアンイストールすることで、すべての収集した情報が削除されます。</Content>
          <Content>退会に伴う申請等は必要ありません。</Content>

          <Index>・免責事項</Index>
          <Content>当サービスに掲載される課題の情報の正確性には万全を期していますが、ユーザーが当サービスを用いて行う行為や課題の提出の可否に関して、当サービスは一切の責任を負わないものとします。</Content>
          <Content>あくまでも補助的なサービスとしてご利用ください。</Content>
        </Paragraph>
        <Paragraph>
          <Title>その他事項</Title>
          <Index>・リンクについて</Index>
          <Content>本サイト・拡張機能ストアのリンクは、自由に設置していただいて構いません。</Content>
          <Content>ただし、Webサイトの内容等によってはリンクの設置をお断りすることがあります。</Content>

          <Index>・お問い合わせ</Index>
          <Content>racsu.shinshu-univ[at]gmail.comへメールでお問い合わせください。</Content>
        </Paragraph>
      </Box>
    </main>
  );
}
