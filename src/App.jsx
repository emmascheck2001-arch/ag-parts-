import { useState, useEffect } from 'react'
import { Home } from './screens/Home'
import { SearchResults } from './screens/SearchResults'
import { PartDetails } from './screens/PartDetails'
import { Categories } from './screens/Categories'
import { MachineDetails } from './screens/MachineDetails'
import { Machines } from './screens/Machines'
import { PickMachine } from './screens/PickMachine'
import { Checkout } from './screens/Checkout'
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

export default function App() {
  const [screen, setScreen] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMachine, setSearchMachine] = useState(null) // machine to scope a search to
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])

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
    // Searching from the home screen first asks which machine the part is for,
    // so results are scoped to parts that actually fit it (never the wrong part).
    setSearchQuery(query)
    setScreen('pick-machine')
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
    // Functional update so batch adds (e.g. a service kit) accumulate correctly.
    setCart((c) => [...c, { ...item, partName: item.partName || 'Part' }])
    if (!item.silent) setScreen('checkout') // silent = add to cart without jumping to checkout
  }

  const handleCheckout = (orderData) => {
    const order = {
      ...orderData,
      createdAt: new Date().toISOString(),
    }
    setOrders([...orders, order])
    setCart([])
    setScreen('order-tracking')
    saveOrder(order) // persist to DB (no-op if backend unconfigured)
    alert('Order confirmed! Order ID: ' + order.orderId)
  }

  return (
    <div className="phone">
      {/* All Screens */}
      <div style={{ display: screen === 'home' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: '74px' }}>
        <Home onSelect={handleSelect} onSearch={handleSearch} onNav={handleNavigation} />
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
          onBack={handleHome}
          onConfirm={handleCheckout}
        />
      )}

      {screen === 'order-tracking' && (
        <OrderTracking orders={orders} onBack={handleHome} />
      )}

      {screen === 'scan' && (
        <Scan onBack={handleHome} />
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
        active={screen === 'order-tracking' ? 'orders' : screen === 'account' ? 'account' : 'home'}
        onNav={handleNavigation}
      />
    </div>
  )
}
