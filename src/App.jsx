import { useEffect, useState } from 'react'
import { Home } from './screens/Home'
import { SearchResults } from './screens/SearchResults'
import { PartDetails } from './screens/PartDetails'
import { PickMachine } from './screens/PickMachine'
import { MachineDetails } from './screens/MachineDetails'
import { Machines } from './screens/Machines'
import { PilotCatalog } from './screens/PilotCatalog'
import { Scan } from './screens/Scan'
import { HowItWorks } from './screens/HowItWorks'
import { BottomNav } from './components/BottomNav'
import { loadMachines } from './lib/db'
import { loadDiagrams } from './lib/diagrams'
import { loadPilotMachineIndex } from './lib/pilot-catalog'
import { addRecent } from './lib/recent-searches'
import { findVerifiedMatch } from './lib/saved-machines'
import {
  getFleet,
  getVerifiedFleet,
  pruneVerifiedFleet,
  removeFleetMachine,
  removeVerifiedMachine,
  saveFleetMachine,
  saveVerifiedMachine,
  toggleFleet,
} from './lib/fleet'

const ACTIVE_MACHINE_KEY = 'ezparts_active_verified_machine'

function readActiveMachine() {
  try { return localStorage.getItem(ACTIVE_MACHINE_KEY) || null } catch { return null }
}

function writeActiveMachine(modelId) {
  try {
    if (modelId) localStorage.setItem(ACTIVE_MACHINE_KEY, modelId)
    else localStorage.removeItem(ACTIVE_MACHINE_KEY)
  } catch { /* ignore */ }
}

// EzParts — a parts + machine search engine. Pick the machine, then find the
// part. No dealers, prices, or checkout.
//
// Two machine paths exist: the verified catalog (PilotCatalog — diagrams and
// source-backed numbers) and the older browse index (MachineDetails ->
// SearchResults -> PartDetails), which still serves machines saved before the
// verified catalog covered them.
export default function App() {
  const [screen, setScreen] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMachine, setSearchMachine] = useState(null)
  const [selectedPart, setSelectedPart] = useState(null)
  const [partBackScreen, setPartBackScreen] = useState('home')
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [selectedPilotModel, setSelectedPilotModel] = useState(readActiveMachine)
  const [verifiedFleet, setVerifiedFleet] = useState(() => {
    const current = getVerifiedFleet()
    const activeModelId = readActiveMachine()
    return activeModelId && !current.some((machine) => machine.modelId === activeModelId)
      ? saveVerifiedMachine(activeModelId)
      : current
  })
  const [legacyFleet, setLegacyFleet] = useState(getFleet)
  const [pilotInitialQuery, setPilotInitialQuery] = useState('')
  const [scanContext, setScanContext] = useState(null)
  const [catalogMachines, setCatalogMachines] = useState([])
  const [, setIndexTick] = useState(0)

  // Load only the (small) machine list up front — parts are queried per machine,
  // so the app scales without loading the whole catalog.
  useEffect(() => {
    loadMachines().then(() => setIndexTick((t) => t + 1))
    loadDiagrams().then((ok) => { if (ok) setIndexTick((t) => t + 1) })
    loadPilotMachineIndex()
      .then((value) => {
        const machines = value?.machines || []
        setCatalogMachines(machines)
        const validModelIds = machines.map((machine) => machine.id)
        setVerifiedFleet(pruneVerifiedFleet(validModelIds))
        if (selectedPilotModel && !validModelIds.includes(selectedPilotModel)) {
          setSelectedPilotModel(null)
          writeActiveMachine(null)
        }
      })
      .catch(() => {})
  }, [])

  const handleHome = () => {
    setPilotInitialQuery('')
    setScanContext(null)
    setScreen('home')
  }

  const handleNavigation = (navScreen) => {
    const target = navScreen === 'machines' ? 'machines-list' : navScreen
    if (target === 'home') return handleHome()
    setScreen(['machines-list', 'help'].includes(target) ? target : 'home')
  }

  const openVerifiedMachine = (modelId, query = '') => {
    setSelectedPilotModel(modelId)
    setVerifiedFleet(saveVerifiedMachine(modelId))
    setPilotInitialQuery(query)
    if (query.trim()) addRecent(query)
    writeActiveMachine(modelId)
    setScreen('pilot-catalog')
  }

  const handleSelect = (type, value) => {
    if (type === 'pilot-machine') return openVerifiedMachine(value)

    if (type === 'machines' || type === 'legacy-machine') {
      // Prefer the verified catalog when this legacy name now has one.
      const verifiedMatchId = findVerifiedMatch(value, catalogMachines)
      if (verifiedMatchId) return openVerifiedMachine(verifiedMatchId)

      if (type === 'legacy-machine') setLegacyFleet(saveFleetMachine(value))
      setSelectedMachine(value)
      setScreen('machine-details')
    }
  }

  const handleRemoveMachine = (saved) => {
    if (saved.kind === 'verified') {
      setVerifiedFleet(removeVerifiedMachine(saved.ref))
      if (selectedPilotModel === saved.ref) {
        setSelectedPilotModel(null)
        writeActiveMachine(null)
      }
      return
    }
    setLegacyFleet(removeFleetMachine(saved.ref))
  }

  const handlePartSelect = (partNum, backScreen = 'home') => {
    setSelectedPart(partNum)
    setPartBackScreen(backScreen)
    setScreen('part-details')
  }

  const handlePilotScan = (machineName) => {
    setScanContext({ type: 'pilot', modelId: selectedPilotModel, machineName })
    setPilotInitialQuery('')
    setScreen('scan')
  }

  const handleMachineScan = (machineName) => {
    setSelectedMachine(machineName)
    setScanContext({ type: 'legacy', machineName })
    setScreen('scan')
  }

  const handleDetected = (partNumber) => {
    addRecent(partNumber)
    if (scanContext?.type === 'pilot') {
      const modelId = scanContext.modelId
      setScanContext(null)
      openVerifiedMachine(modelId, partNumber)
      return
    }
    setSearchQuery(partNumber)
    setSearchMachine(scanContext?.machineName || null)
    setScanContext(null)
    setScreen('search-results')
  }

  return (
    <div className="phone">
      <div className={screen === 'home' ? 'app-route app-route--active' : 'app-route'}>
        <Home
          onSelect={handleSelect}
          onNav={handleNavigation}
          activePilotModel={selectedPilotModel}
          verifiedFleet={verifiedFleet}
          legacyFleet={legacyFleet}
          onRemoveMachine={handleRemoveMachine}
        />
      </div>

      {screen === 'machines-list' && (
        <Machines onBack={handleHome} onSelect={handleSelect} />
      )}

      {screen === 'pick-machine' && (
        <PickMachine
          query={searchQuery}
          onPick={(machineName) => { setSearchMachine(machineName); setScreen('search-results') }}
          onBack={handleHome}
        />
      )}

      {screen === 'search-results' && (
        <SearchResults
          query={searchQuery}
          machine={searchMachine}
          onBack={handleHome}
          onChangeMachine={() => setScreen('pick-machine')}
          onPartSelect={(partNum) => handlePartSelect(partNum, 'search-results')}
          onMachineSelect={(machineName) => handleSelect('machines', machineName)}
        />
      )}

      {screen === 'part-details' && selectedPart && (
        <PartDetails
          partNum={selectedPart}
          onBack={() => setScreen(partBackScreen)}
          onMachineSelect={(machineName) => handleSelect('machines', machineName)}
        />
      )}

      {screen === 'machine-details' && selectedMachine && (
        <MachineDetails
          machine={selectedMachine}
          onBack={handleHome}
          onScan={() => handleMachineScan(selectedMachine)}
          onPartSelect={(partNum) => handlePartSelect(partNum, 'machine-details')}
          inFleetSaved={legacyFleet.includes(selectedMachine)}
          onToggleFleet={(machineName) => setLegacyFleet(toggleFleet(machineName))}
        />
      )}

      {screen === 'pilot-catalog' && selectedPilotModel && (
        <PilotCatalog
          modelId={selectedPilotModel}
          initialQuery={pilotInitialQuery}
          onBack={handleHome}
          onScan={handlePilotScan}
        />
      )}

      {screen === 'scan' && (
        <Scan
          machineName={scanContext?.machineName}
          scanContext={scanContext}
          onBack={() => setScreen(scanContext?.type === 'pilot' ? 'pilot-catalog' : 'machine-details')}
          onDetected={handleDetected}
        />
      )}

      {screen === 'help' && (
        <HowItWorks onBack={handleHome} />
      )}

      <BottomNav
        active={screen === 'machines-list' ? 'machines' : screen === 'help' ? 'help' : 'home'}
        onNav={handleNavigation}
      />
    </div>
  )
}
