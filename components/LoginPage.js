import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import styles from '../styles/Home.module.css'
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Stack,
  Button,
  Heading,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react'
import { SignInButton } from '../pages/enter'

const LoginPage = () => {

  const [ clicked, setClicked ] = useState(false)

  const handleClick = () => {
    setClicked(!clicked)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Succinct Cut</title>
        <meta name="description" content="Snip Snip" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Flex
          align={'center'}
          justify={'center'}
          bg={useColorModeValue('gray.50', 'gray.800')}>
          <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
            <Stack align={'center'}>
              <Heading fontSize={'4xl'}>Sign In</Heading>
            </Stack>
            <Box
              rounded={'lg'}
              bg={useColorModeValue('white', 'gray.700')}
              boxShadow={'lg'}
              p={8}>
              <Stack spacing={4}>
                <FormControl id="email">
                  <FormLabel>Email address</FormLabel>
                  <Input type="email" />
                </FormControl>
                <FormControl id="password">
                  <FormLabel>Password</FormLabel>
                  <Input type="password" />
                </FormControl>
                <Stack spacing={10}>
                  <Stack
                    direction={{ base: 'column', sm: 'row' }}
                    align={'start'}
                    justify={'space-between'}>
                    <Checkbox>Remember me</Checkbox>
                    <a href="#">Forgot password?</a>
                  </Stack>
                  <Button
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}>
                    Sign in
                  </Button>
                  <SignInButton />
                  {/* <Link href="/">
                    { clicked ? 
                      <Button
                        isLoading colorScheme='teal' variant='solid'>
                          <Image src="/google.svg" width={72} height={16} />
                      </Button>
                      
                      : <Button
                        bg={'white'}
                        color={'gray.400'}
                        _hover={{
                          boxShadow: 'md',
                        }}
                        onClick={ handleClick }>
                          <Image src="/google.svg" width={72} height={16} />
                      </Button>
                    }
                  </Link> */}
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Flex>
      </main>

    </div>
  )
}

export default LoginPage