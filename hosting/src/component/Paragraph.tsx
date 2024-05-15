/** @jsxImportSource @emotion/react */
"use client";

import { css } from '@emotion/react';
import { Box } from '@mui/material';
import React from 'react';
import color from "@/color.json";

const style = {
  paragraph: css`
    margin-top: 10px;

    & + & {
      margin-top: 40px;
    }

    span {
      display: inline-block;
    }
  `,

  title: css`
    position: relative;
    font-size: 25px;
    font-weight: normal;
    color: ${color.blue};
    box-sizing: border-box;

    &::before {
      position: absolute;
      bottom: 0;
      content: '';
      width: calc(100% + 20px);
      border-bottom: 3px solid #1b5aad;
      transform: translateX(-20px);
    }
  `,

  index: css`
    font-size: 19px;
    font-weight: bold;
    margin-top: 14px;
  `,

  content: css`
    font-size: 16px;
    margin: 5px 10px 0 10px;
  `,

  description: css`
    font-size: 16px;

    h1 + &, h2 + & {
      margin: 10px 0 0 0;
    }
  `
}

export default function Paragraph({children}: {children: React.ReactNode[]}) {
  return (
    <Box css={style.paragraph}>
      {children}
    </Box>
  )
}

export function Title({children}: {children: string | React.ReactNode}) {
  return (
    <h1 css={style.title}>{children}</h1>
  )
}

export function Index({children}: {children: string | React.ReactNode}) {
  return (
    <h2 css={style.index}>{children}</h2>
  )
}

export function Content({children}: {children: string | React.ReactNode}) {
  return (
    <p css={style.content}>{children}</p>
  )
}

export function Description({children}: {children: string | React.ReactNode}) {
  return (
    <p css={style.description}>{children}</p>
  )
}