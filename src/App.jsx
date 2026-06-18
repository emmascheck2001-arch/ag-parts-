import { useState, useEffect } from 'react'
import { Home } from './screens/Home'
import { SearchResults } from './screens/SearchResults'
import { PartDetails } from './screens/PartDetails'
import { Categories } from './screens/Categories'
import { MachineDetails } from './screens/MachineDetails'
import { Checkout } from './screens/Checkout'
import { OrderTracking } from './screens/OrderTracking'
import { Scan } from './screens/Scan'
import { HowItWorks } from './screens/HowItWorks'
import { Map } from './screens/Map'
import { Account } from './screens/Account'
import { Dealer } from './screens/Dealer'
import { DealerDashboard } from './screens/DealerDashboard'
import { Extract } from './screens/Extract'
import { BottomNav } from './components/BottomNav'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])

  // Deep-link back from Stripe Connect onboarding (?screen=dealer).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('screen') === 'dealer') {
      setScreen('dealer')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Navigation handlers
  const handleNavigation = (navScreen) => {
    // Map nav-tab ids to real screens (tabs without a dedicated screen fall back to home).
    const map = { search: 'home', machines: 'home', orders: 'order-tracking' }
    setScreen(map[navScreen] || navScreen)
  }

  const handleHome = () => {
    setScreen('home')
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
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
    setCart([...cart, { ...item, partName: item.partName || 'Part' }])
    setScreen('checkout')
  }

  const handleCheckout = (orderData) => {
    const order = {
      ...orderData,
      createdAt: new Date().toISOString(),
    }
    setOrders([...orders, order])
    setCart([])
    setScreen('order-tracking')
    alert('Order confirmed! Order ID: ' + order.orderId)
  }

  return (
    <div className="phone">
      {/* All Screens */}
      <div style={{ display: screen === 'home' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: '74px' }}>
        <Home onSelect={handleSelect} onSearch={handleSearch} onNav={handleNavigation} />
      </div>

      {screen === 'search-results' && (
        <SearchResults
          query={searchQuery}
          onBack={handleHome}
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

      {screen === 'machine-details' && selectedMachine && (
        <MachineDetails 
          machine={selectedMachine} 
          onBack={handleHome}
          onPartSelect={handlePartSelect}
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

      {screen === 'account' && (
        <Account onBack={handleHome} onNav={handleNavigation} />
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

      {/* Bottom Navigation */}
      <BottomNav
        active={screen === 'order-tracking' ? 'orders' : screen === 'account' ? 'account' : 'home'}
        onNav={handleNavigation}
      />
    </div>
  )
}
