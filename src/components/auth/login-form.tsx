'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BsPersonFill, BsKeyFill } from 'react-icons/bs'

// Function to set a cookie
const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Function to get a cookie
const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

// Function to erase a cookie
const eraseCookie = (name: string) => {   
  document.cookie = name+'=; Max-Age=-99999999; path=/;';  
}

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authStatus = getCookie('isAuthenticated') === 'true'
    setIsAuthenticated(authStatus)
    if(authStatus) {
      router.refresh();
    }
  }, [router])


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'genfosis' && password === 'sisfogen') {
      setCookie('isAuthenticated', 'true', 7) // Set cookie for 7 days
      setIsAuthenticated(true)
      router.refresh() // To re-trigger middleware and update layout
      router.push('/')
    } else {
      setError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    eraseCookie('isAuthenticated')
    setIsAuthenticated(false)
    router.refresh() // To re-trigger middleware
  }

  if (isAuthenticated) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">You are logged in</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <BsPersonFill className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="genfosis"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <BsKeyFill className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-center text-gray-500 w-full">
          &copy; {new Date().getFullYear()} Longevity Bar. All rights reserved.
        </p>
      </CardFooter>
    </Card>
  )
}
