'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, Phone, MapPin } from 'lucide-react'

export default function SettingsPage() {
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [retellNumber, setRetellNumber] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalOrders: 0,
    monthlyOrders: 0,
    avgOrderValue: 0
  })

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  async function loadSettings() {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setShopName(data.shop_name || '')
        setShopAddress(data.shop_address || '')
        setShopPhone(data.shop_phone || '')
        setRetellNumber(data.retell_phone || '')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          shop_address: shopAddress,
          shop_phone: shopPhone,
          retell_phone: retellNumber,
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('Failed to save settings. Check console for details.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your shop configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Shop Information
          </CardTitle>
          <CardDescription>
            Update your shop details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="shop-name" className="text-sm font-medium">
              Shop Name
            </label>
            <Input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Your Pizza Shop Name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="shop-address" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </label>
            <Input
              id="shop-address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="shop-phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Shop Phone Number
            </label>
            <Input
              id="shop-phone"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="retell-number" className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Retell AI Phone Number
            </label>
            <Input
              id="retell-number"
              value={retellNumber}
              onChange={(e) => setRetellNumber(e.target.value)}
              placeholder="(555) 987-6543"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              This is your AI-powered order line. Customers call this number to place orders.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button onClick={handleSave} className="w-full sm:w-auto" disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{stats.monthlyOrders}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
