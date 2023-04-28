import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'

const inter = Inter({ subsets: ['latin'] })

const path_picture = "http://localhost:3001/picture"

export default function Home() {
  return (
    <>
      <Head>
        <title>Weilplace</title>
        <meta name="description" content="Coloque um Pixel!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={`${styles.pictureContainer}`}>
        <img src={path_picture} className={`${styles.picture}`}></img>
        </div>
      </main>
    </>
  )
}
