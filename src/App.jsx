import { useState, useEffect } from 'react'
import { Home } from './screens/Home'
import { SearchResults } from './screens/SearchResults'
import { PartDetails } from './screens/PartDetails'
import { Categories } from './screens/Categories'
import { MachineDetails } from './screens/MachineDetails'
import { Machines } from './screens/Machines'
import { PickMachine } from './screens/PickMachine'
import { Checkout } from './screens/Checkout'
import { Cart } from './screens/Cart'
import { OrderTracking } from './screens/OrderTracking'
import { Scan } from './screens/Scan'
import { HowItWorks } from './screens/HowItWorks'
import { Map } from './screens/Map'
import { Account } from './screens/Account'
import { Dealer } from './screens/Dealer'
import { DealerDashboard } from './screens/DealerDashboard'
import { Extract } from './screens/Extract'
import { ListPart } from './screens/ListPart'
import { BottomNav } from './components/BottomNav'
import { loadIndex } from './lib/index-store'
import { loadInventory } from './lib/inventory'
import { loadDiagrams } from './lib/diagrams'
import { saveOrder } from './lib/orders'
import { Auth } from './screens/Auth'
import { getSession, onAuthChange, getProfile, signOut } from './lib/auth'
import { getRecent, addRecent, clearRecent } from './lib/recent-searches'
import { initLocation } from './lib/geo'

// A single token of letters/digits/dashes, length >= 4, containing at least one
// digit (e.g. RE509672, AT63771, 87300041) — a part number, not a phrase.
function looksLikePartNumber(query) {
  const q = (query || '').trim()
  return /^[A-Za-z0-9-]{4,}$/.test(q) && /\d/.test(q)
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMachine, setSearchMachine] = useState(null) // machine to scope a search to
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  const [recent, setRecent] = useState(getRecent())

  const [, setIndexTick] = useState(0)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authTarget, setAuthTarget] = useState(null) // screen to go to after sign-in

  // Track auth session + profile (farmers stay guests; dealers sign in).
  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      if (s?.user?.id) getProfile(s.user.id).then(setProfile)
    })
    const unsub = onAuthChange((s) => {
      setSession(s)
      if (s?.user?.id) getProfile(s.user.id).then(setProfile)
      else setProfile(null)
    })
    return unsub
  }, [])

  // Deep-link back from Stripe Connect onboarding (?screen=dealer).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('screen') === 'dealer') {
      setScreen('dealer')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Load the fitment index from Supabase once; re-render when it arrives.
  // Falls back silently to the demo seed if Supabase is empty/unreachable.
  useEffect(() => {
    loadIndex().then((ok) => { if (ok) setIndexTick((t) => t + 1) })
    loadInventory().then((ok) => { if (ok) setIndexTick((t) => t + 1) })
    loadDiagrams().then((ok) => { if (ok) setIndexTick((t) => t + 1) })
    initLocation().then((changed) => { if (changed) setIndexTick((t) => t + 1) }) // real "near me"
  }, [])

  // Navigation handlers
  const handleNavigation = (navScreen) => {
    // Map nav-tab ids to real screens (tabs without a dedicated screen fall back to home).
    const map = { search: 'home', machines: 'machines-list', orders: 'order-tracking' }
    const target = map[navScreen] || navScreen
    // Dealer area requires sign-in (farmers stay guests).
    const DEALER_SCREENS = ['dealer', 'dealer-dashboard', 'list-part']
    if (DEALER_SCREENS.includes(target) && !session) {
      setAuthTarget(target)
      setScreen('auth')
      return
    }
    setScreen(target)
  }

  const handleHome = () => {
    setScreen('home')
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query && query.trim()) setRecent(addRecent(query)) // remember real searches

    // A part number is globally unique — asking "which machine?" is pure friction.
    // If the query is a single part-number-shaped token, go straight to results
    // (all machines). Otherwise ask which machine so results are scoped to fit.
    if (looksLikePartNumber(query)) {
      setSearchMachine(null)
      setScreen('search-results')
    } else {
      setScreen('pick-machine')
    }
  }

  const handlePickSearchMachine = (machineName) => {
    setSearchMachine(machineName) // null = search all machines
    setScreen('search-results')
  }

  const handleSelect = (type, value) => {
    if (type === 'machines') {
      setSelectedMachine(value)
      setScreen('machine-details')
    } else if (type === 'category') {
      // Tapping a category shows the parts in it (via search match on category).
      handleSearch(value)
    } else if (type === 'categories') {
      handleHome()
    }
  }

  const handlePartSelect = (partNum) => {
    setSelectedPart(partNum)
    setScreen('part-details')
  }

  const handleBuy = (item) => {
    setCart((c) => {
      // One order = one dealer (checkout pays a single dealer). If this part is
      // from a different dealer than what's already in the cart, start fresh.
      const cartDealer = c[0]?.supplier?.s
      const itemDealer = item.supplier?.s
      const base = cartDealer && itemDealer && cartDealer !== itemDealer ? [] : c
      // Same part + same dealer already in cart → bump quantity instead of duplicating.
      const i = base.findIndex(
        (x) => x.pn === item.pn && x.supplier?.s === itemDealer
      )
      if (i >= 0) {
        const next = [...base]
        next[i] = { ...next[i], qty: (next[i].qty || 1) + (item.qty || 1) }
        return next
      }
      return [...base, { ...item, qty: item.qty || 1, partName: item.partName || 'Part' }]
    })
    if (!item.silent) setScreen('cart') // review the cart first; silent = add without navigating
  }

  const handleReorder = (order) => {
    // Re-add a past order's items (one dealer per order) and open the cart.
    ;(order.cart || []).forEach((it) => handleBuy({ ...it, silent: true }))
    setScreen('cart')
  }

  const updateCartQty = (index, qty) => {
    setCart((c) =>
      qty <= 0
        ? c.filter((_, i) => i !== index)
        : c.map((item, i) => (i === index ? { ...item, qty } : item))
    )
  }

  const handleCheckout = (orderData) => {
    const order = {
      ...orderData,
      createdAt: new Date().toISOString(),
      // `paid` is only ever true after a real Stripe charge (PaymentForm.onPaid).
      // Every other path is an unpaid, dealer-confirmed order — never claim paid.
      paid: orderData.paid === true,
    }
    setOrders([...orders, order])
    setCart([])
    setScreen('order-tracking')
    saveOrder(order) // persist to DB (no-op if backend unconfigured)
    // No blocking alert, no false "confirmed/paid" claim — OrderTracking shows
    // the real status (order placed, dealer to confirm).
  }

  return (
    <div className="phone">
      {/* All Screens */}
      <div style={{ display: screen === 'home' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: '74px' }}>
        <Home
          onSelect={handleSelect}
          onSearch={handleSearch}
          onNav={handleNavigation}
          recent={recent}
          onClearRecent={() => setRecent(clearRecent())}
        />
      </div>

      {screen === 'pick-machine' && (
        <PickMachine
          query={searchQuery}
          onPick={handlePickSearchMachine}
          onBack={handleHome}
        />
      )}

      {screen === 'search-results' && (
        <SearchResults
          query={searchQuery}
          machine={searchMachine}
          onBack={handleHome}
          onChangeMachine={() => setScreen('pick-machine')}
          onPartSelect={handlePartSelect}
          onBuy={handleBuy}
          onViewMap={() => setScreen('map')}
          onMachineSelect={(nm) => handleSelect('machines', nm)}
        />
      )}

      {screen === 'part-details' && selectedPart && (
        <PartDetails
          partNum={selectedPart}
          onBack={handleHome}
          onBuy={handleBuy}
          onViewMap={() => setScreen('map')}
          onMachineSelect={(nm) => handleSelect('machines', nm)}
        />
      )}

      {screen === 'categories' && (
        <Categories onBack={handleHome} onSelect={handleSelect} />
      )}

      {screen === 'machines-list' && (
        <Machines onBack={handleHome} onSelect={handleSelect} />
      )}

      {screen === 'machine-details' && selectedMachine && (
        <MachineDetails
          machine={selectedMachine}
          onBack={handleHome}
          onPartSelect={handlePartSelect}
          onBuy={handleBuy}
        />
      )}

      {screen === 'checkout' && (
        <Checkout
          cart={cart}
          onBack={() => setScreen('cart')}
          onConfirm={handleCheckout}
          onQty={updateCartQty}
        />
      )}

      {screen === 'cart' && (
        <Cart
          cart={cart}
          onQty={updateCartQty}
          onCheckout={() => setScreen('checkout')}
          onBack={handleHome}
          onContinue={handleHome}
        />
      )}

      {screen === 'order-tracking' && (
        <OrderTracking orders={orders} onBack={handleHome} onReorder={handleReorder} />
      )}

      {screen === 'scan' && (
        <Scan
          onBack={handleHome}
          onDetected={(pn) => { setSearchQuery(pn); setSearchMachine(null); setScreen('search-results') }}
        />
      )}

      {screen === 'help' && (
        <HowItWorks onBack={handleHome} />
      )}

      {screen === 'map' && (
        <Map onBack={handleHome} />
      )}

      {screen === 'auth' && (
        <Auth
          onBack={() => setScreen('account')}
          reason={authTarget ? 'Sign in to access the dealer area.' : undefined}
          onAuthed={() => { const t = authTarget; setAuthTarget(null); setScreen(t || 'account') }}
          onGuest={handleHome}
        />
      )}

      {screen === 'account' && (
        <Account
          onBack={handleHome}
          onNav={handleNavigation}
          session={session}
          profile={profile}
          onSignIn={() => { setAuthTarget(null); setScreen('auth') }}
          onSignOut={async () => { await signOut(); setSession(null); setProfile(null) }}
        />
      )}

      {screen === 'dealer' && (
        <Dealer onBack={() => setScreen('account')} onNav={handleNavigation} />
      )}

      {screen === 'dealer-dashboard' && (
        <DealerDashboard orders={orders} onBack={() => setScreen('dealer')} />
      )}

      {screen === 'extract' && (
        <Extract onBack={() => setScreen('account')} />
      )}

      {screen === 'list-part' && (
        <ListPart onBack={() => setScreen('dealer')} onNav={handleNavigation} dealerName={profile?.dealer_name || ''} />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        active={
          screen === 'order-tracking' ? 'orders'
            : screen === 'account' ? 'account'
            : screen === 'cart' ? 'cart'
            : screen === 'machines-list' ? 'machines'
            : 'home'
        }
        cartCount={cart.reduce((s, it) => s + (it.qty || 1), 0)}
        onNav={handleNavigation}
      />
    </div>
  )
}
