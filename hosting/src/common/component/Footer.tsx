/** @jsxImportSource @emotion/react */
"use client";

import React from 'react'

import { css } from '@emotion/react';
import { Box, Button } from '@mui/material';
import Link from 'next/link';
import { usePathname } from "next/navigation";

import color from "@/common/color.json";
import url from "@/common/url.json";

const style = {
  footer: css`
    background-color: ${color.gray};
    color: #ffffff;
    padding: 30px 10px;
  `,

  icon: css`
    height: 50px;
    width: 50px;
    margin: 5px 10px 5px 20px;
    @media screen and (max-width:850px) {
      height: 40px;
      width: 40px;
      margin: 5px 10px 5px 15px;
    }
  `,

  icon_link: css`
    display: flex;
    color: #ffffff;
    text-decoration: none;
    width: fit-content;
  `,

  icon_text: css`
    font-size: 25px;
    @media screen and (max-width:850px) {
      font-size: 23px;
    }
  `,

  icon_text_sub: css`
    font-size: 16px;
    margin-bottom: 3px;
    margin-left: 5px;
  `,

  nav: css`
    font-size: 13px;
    margin-left: 10px;

    & ul {
      margin-top: 15px;

      & li {
        list-style: none;
        margin: 10px 18px;

        & a {
          color: #ffffff;
          text-decoration: none;
        }
      }
    }
  `
}

export default function Footer() {
  const pathName = usePathname();

  const isCurrentPath = (linkTo: string) => {
    if(pathName == linkTo) {
      return "current"
    }
  }

  return (
    <>
      <Box css={style.footer}>
        <Box>
          <Link css={style.icon_link} href="/">
            <img src="/icon/iconmono.png" alt="RACSU icon" css={style.icon}/>
            <Box display="flex" alignItems="flex-end" marginBottom="8px">
              <p css={style.icon_text}>RACSU</p>
              <p css={style.icon_text_sub}>for eALPS</p>
            </Box>
          </Link>
        </Box>
        <Box css={style.nav}>
          <ul>
            <li className={isCurrentPath("/")}><Link href="/">トップ</Link></li>
            <li><a href={url.store} target="_blank">インストール</a></li>
            <li className={isCurrentPath("/usage/")}><Link href="/usage/">使い方</Link></li>
            <li className={isCurrentPath("/fqa/")}><Link href="/fqa/">FQA</Link></li>
            <li className={isCurrentPath("/privacy/")}><Link href="/privacy/">プライバシーポリシー</Link></li>
            <li><a href={url.github} target="_blank">Github</a></li>
            <li>お問い合わせ：racsu.shinshu-univ[at]gmail.com </li>
          </ul>
        </Box>
      </Box>
    </>
  )
}