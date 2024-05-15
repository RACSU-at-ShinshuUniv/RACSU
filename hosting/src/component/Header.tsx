/** @jsxImportSource @emotion/react */
"use client";

import React from 'react'

import { css } from '@emotion/react';
import { Button, IconButton, AppBar, Box, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { usePathname } from "next/navigation";

import color from "@/color.json";
import url from "@/url.json";

const style = {
  header: css`
    display: flex;
    flex-direction: row;
    background-color: #ffffff;
  `,

  icon: css`
    height: 50px;
    width: 50px;
    margin: 5px 10px 5px 20px;
    @media screen and (max-width:950px) {
      height: 40px;
      width: 40px;
      margin: 5px 10px 5px 15px;
    }
  `,

  icon_link: css`
    display: flex;
    color: ${color.blue};
    text-decoration: none;
  `,

  icon_text: css`
    font-size: 25px;
    @media screen and (max-width:950px) {
      font-size: 23px;
    }
  `,

  icon_text_sub: css`
    font-size: 16px;
    margin-bottom: 3px;
    margin-left: 5px;
  `,

  nav_pc: css`
    display: flex;
    @media screen and (max-width:950px) {
      display: none;
    }
    align-items: center;
    margin-left: auto;

    & ul {
      display: flex;

      & li {
        list-style: none;
        margin-right: 40px;

        & a {
          color: ${color.blue};
          text-decoration: none;
        }

        &:hover {
          border-bottom: 1.5px solid ${color.blue};
        }
      }

      & .current {
        border-bottom: 1.5px solid ${color.blue};
      }
    }
  `,

  nav_sp: css`
    display: none;
    @media screen and (max-width:950px) {
      display: flex;
    }
    margin-left: auto;
    align-items: center;
  `,

  nav_pc_drawer: css`
    & ul {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 40px;

      & li {
        list-style: none;
        padding: 1px 5px;
        margin: 10px 18px;

        & a {
          color: ${color.blue};
          text-decoration: none;
        }
      }

      & .current {
        border-bottom: 1.5px solid ${color.blue};
      }
    }
  `,

  spacer: css`
    height: 60px;
    @media screen and (max-width:950px) {
      height: 50px;
    }
  `
}

export default function Header() {
  const pathName = usePathname();
  const [openDrawer, setOpenDrawer] = React.useState(false);

  const isCurrentPath = (linkTo: string) => {
    if(pathName == linkTo) {
      return "current"
    }
  }

  return (
    <>
      <AppBar css={style.header}>
        <Box>
          <Link css={style.icon_link} href="/">
            <img src="/icon/icon128.png" alt="RACSU icon" css={style.icon}/>
            <Box display="flex" alignItems="flex-end" marginBottom="8px">
              <p css={style.icon_text}>RACSU</p>
              <p css={style.icon_text_sub}>for eALPS</p>
            </Box>
          </Link>
        </Box>
        <Box css={style.nav_pc}>
          <ul>
            <li className={isCurrentPath("/")}><Link href="/">トップ</Link></li>
            <li><a href={url.store} target="_blank">インストール</a></li>
            <li className={isCurrentPath("/usage/")}><Link href="/usage/">使い方</Link></li>
            <li className={isCurrentPath("/fqa/")}><Link href="/fqa/">FQA</Link></li>
            <li className={isCurrentPath("/privacy/")}><Link href="/privacy/">プライバシーポリシー</Link></li>
            <li><a href={url.github} target="_blank">Github</a></li>
          </ul>
        </Box>
        <Box css={style.nav_sp}>
          <IconButton css={css`width: 40px; height: 40px; margin-right: 10px;`} onClick={() => setOpenDrawer(true)}>
            <MenuIcon css={css`color: ${color.blue};`}/>
          </IconButton>
          <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>
            <Box css={style.nav_pc_drawer} onClick={() => setOpenDrawer(false)}>
              <ul>
                <li className={isCurrentPath("/")}><Link href="/">トップ</Link></li>
                <li><a href={url.store} target="_blank">インストール</a></li>
                <li className={isCurrentPath("/usage/")}><Link href="/usage/">使い方</Link></li>
                <li className={isCurrentPath("/fqa/")}><Link href="/fqa/">FQA</Link></li>
                <li className={isCurrentPath("/privacy/")}><Link href="/privacy/">プライバシーポリシー</Link></li>
                <li><a href={url.github} target="_blank">Github</a></li>
              </ul>
            </Box>
          </Drawer>
        </Box>
      </AppBar>
      <Box css={style.spacer}></Box>
    </>
  );
}