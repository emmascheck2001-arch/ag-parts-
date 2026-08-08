import { useState, useEffect } from 'react'
import { Home } from './screens/Home'
import { SearchResults } from './screens/SearchResults'
import { PartDetails } from './screens/PartDetails'
import { Categories } from './screens/Categories'
import { MachineDetails } from './screens/MachineDetails'
import { Machines } from './screens/Machines'
import { PickMachine } from './screens/PickMachine'
import { PilotCatalog } from './screens/PilotCatalog'
import { Scan } from './screens/Scan'
import { HowItWorks } from './screens/HowItWorks'
import { BottomNav } from './components/BottomNav'
import { loadMachines } from './lib/db'
import { loadDiagrams } from './lib/diagrams'
import { getRecent, addRecent, clearRecent } from './lib/recent-searches'

// A single token of letters/digits/dashes, length >= 4, containing at least one
// digit (e.g. RE509672, 125138) — a part number, not a phrase.
function looksLikePartNumber(query) {
  const q = (query || '').trim()
  return /^[A-Za-z0-9-]{4,}$/.test(q) && /\d/.test(q)
}

// EzParts — a parts + machine SEARCH ENGINE. No dealers, prices, or checkout.
export default function App() {
  const [screen, setScreen] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMachine, setSearchMachine] = useState(null)
  const [selectedPart, setSelectedPart] = useState(null)
  const [partBackScreen, setPartBackScreen] = useState('home')
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [selectedPilotModel, setSelectedPilotModel] = useState(null)
  const [recent, setRecent] = useState(getRecent())
  const [, setIndexTick] = useState(0)

  // Load only the (small) machine list up front — parts are queried server-side
  // per search, so the app scales to millions without loading the whole catalog.
  useEffect(() => {
    loadMachines().then(() => setIndexTick((t) => t + 1))
    loadDiagrams().then((ok) => { if (ok) setIndexTick((t) => t + 1) })
  }, [])

  const handleNavigation = (navScreen) => {
    const map = { search: 'home', machines: 'machines-list' }
    const target = map[navScreen] || navScreen
    const known = ['home', 'machines-list', 'categories', 'scan', 'help']
    setScreen(known.includes(target) ? target : 'home')
  }
  const handleHome = () => setScreen('home')

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query && query.trim()) setRecent(addRecent(query))
    if (looksLikePartNumber(query)) {
      setSearchMachine(null)
      setScreen('search-results')
    } else {
      setScreen('pick-machine')
    }
  }
  const handlePickSearchMachine = (machineName) => {
    setSearchMachine(machineName)
    setScreen('search-results')
  }
  const handleSelect = (type, value) => {
    if (type === 'machines') { setSelectedMachine(value); setScreen('machine-details') }
    else if (type === 'pilot-machine') { setSelectedPilotModel(value); setScreen('pilot-catalog') }
    else if (type === 'category') { handleSearch(value) }
    else if (type === 'categories') { handleHome() }
  }
  const handlePartSelect = (partNum, backScreen = 'home') => {
    setSelectedPart(partNum)
    setPartBackScreen(backScreen)
    setScreen('part-details')
  }

  return (
    <div className="phone">
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
        <PickMachine query={searchQuery} onPick={handlePickSearchMachine} onBack={handleHome} />
      )}

      {screen === 'search-results' && (
        <SearchResults
          query={searchQuery}
          machine={searchMachine}
          onBack={handleHome}
          onChangeMachine={() => setScreen('pick-machine')}
          onPartSelect={(partNum) => handlePartSelect(partNum, 'search-results')}
          onMachineSelect={(nm) => handleSelect('machines', nm)}
        />
      )}

      {screen === 'part-details' && selectedPart && (
        <PartDetails
          partNum={selectedPart}
          onBack={() => setScreen(partBackScreen)}
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
          onPartSelect={(partNum) => handlePartSelect(partNum, 'machine-details')}
        />
      )}

      {screen === 'pilot-catalog' && selectedPilotModel && (
        <PilotCatalog modelId={selectedPilotModel} onBack={() => setScreen('machines-list')} />
      )}

      {screen === 'scan' && (
        <Scan onBack={handleHome} onDetected={(pn) => { setSearchQuery(pn); setSearchMachine(null); setScreen('search-results') }} />
      )}

      {screen === 'help' && (
        <HowItWorks onBack={handleHome} />
      )}

      <BottomNav
        active={screen === 'machines-list' ? 'machines' : 'home'}
        onNav={handleNavigation}
      />
    </div>
  )
}
