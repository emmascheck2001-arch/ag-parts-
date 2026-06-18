import { useState } from 'react'
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
import { BottomNav } from './components/BottomNav'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])

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
    } else if (type === 'categories') {
      // For now, categories just shows home
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
        />
      )}

      {screen === 'part-details' && selectedPart && (
        <PartDetails 
          partNum={selectedPart} 
          onBack={handleHome}
          onBuy={handleBuy}
          onViewMap={() => setScreen('map')}
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
        <Account onBack={handleHome} />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        active={screen === 'order-tracking' ? 'orders' : screen === 'account' ? 'account' : 'home'}
        onNav={handleNavigation}
      />
    </div>
  )
}
