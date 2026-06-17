/* Supabase API Layer - Query Functions */
import { supabase } from './supabase'

/**
 * Search parts by query (part number, name, or description)
 * Falls back to demo data if Supabase is unavailable
 */
export async function searchParts(query, useDemoData = true) {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select(`
        id,
        part_number,
        name,
        description,
        category:categories(name),
        suppliers:parts_suppliers(
          id,
          supplier_price,
          shipping_cost,
          shipping_days,
          in_stock,
          oem,
          supplier:suppliers(name, rating, review_count)
        )
      `)
      .or(`part_number.ilike.%${query}%,name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20)

    if (error) throw error
    
    // Transform to match demo data structure
    return data.map(part => ({
      pn: part.part_number,
      name: part.name,
      cat: part.category?.name || 'Other',
      suppliers: part.suppliers.map(s => ({
        s: s.supplier.name,
        price: s.supplier_price,
        ship: s.shipping_cost,
        rating: s.supplier.rating,
        n: s.supplier.review_count,
        days: s.shipping_days,
        stock: s.in_stock,
        oem: s.oem,
      })),
    }))
  } catch (error) {
    console.log('Supabase error, using demo data:', error.message)
    return [] // Return empty array if Supabase fails
  }
}

/**
 * Get single part by part number
 */
export async function getPartByNumber(partNumber) {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select(`
        id,
        part_number,
        name,
        description,
        category:categories(name),
        suppliers:parts_suppliers(
          supplier_price,
          shipping_cost,
          shipping_days,
          in_stock,
          oem,
          supplier:suppliers(name, rating, review_count)
        )
      `)
      .eq('part_number', partNumber)
      .single()

    if (error) throw error
    
    return {
      pn: data.part_number,
      name: data.name,
      cat: data.category?.name,
      suppliers: data.suppliers.map(s => ({
        s: s.supplier.name,
        price: s.supplier_price,
        ship: s.shipping_cost,
        rating: s.supplier.rating,
        n: s.supplier.review_count,
        days: s.shipping_days,
        stock: s.in_stock,
        oem: s.oem,
      })),
    }
  } catch (error) {
    console.log('Error fetching part:', error.message)
    return null
  }
}

/**
 * Get all machines
 */
export async function getMachines() {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('id, name, type, emoji')

    if (error) throw error
    
    return data.map(m => ({
      nm: m.name,
      ty: m.type,
      ic: m.emoji,
    }))
  } catch (error) {
    console.log('Error fetching machines:', error.message)
    return []
  }
}

/**
 * Get all categories
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, emoji')

    if (error) throw error
    
    return data.map(c => ({
      t: c.name,
      ic: c.emoji,
    }))
  } catch (error) {
    console.log('Error fetching categories:', error.message)
    return []
  }
}

/**
 * Get parts for a specific machine
 */
export async function getMachineParts(machineId) {
  try {
    const { data, error } = await supabase
      .from('machine_part_fitment')
      .select(`
        part:parts(
          id,
          part_number,
          name,
          emoji,
          suppliers:parts_suppliers(
            supplier_price,
            shipping_cost
          )
        )
      `)
      .eq('machine_id', machineId)
      .eq('verified', true)

    if (error) throw error
    
    return data.map(item => {
      const prices = item.part.suppliers.map(s => s.supplier_price + s.shipping_cost)
      return {
        pn: item.part.part_number,
        name: item.part.name,
        ic: item.part.emoji,
        from: Math.min(...prices),
      }
    })
  } catch (error) {
    console.log('Error fetching machine parts:', error.message)
    return []
  }
}

/**
 * Save an order to Supabase
 */
export async function saveOrder(orderData) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderData.orderId,
          customer_email: orderData.email,
          customer_phone: orderData.phone,
          customer_address: orderData.address,
          total_price: orderData.total,
          status: 'pending',
        },
      ])
      .select()

    if (error) throw error
    
    // Save order items
    for (const item of orderData.cart) {
      const supplier = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', item.supplier)
        .single()

      const part = await supabase
        .from('parts')
        .select('id')
        .eq('part_number', item.pn)
        .single()

      if (supplier.data && part.data) {
        await supabase.from('order_items').insert([
          {
            order_id: data[0].id,
            part_id: part.data.id,
            supplier_id: supplier.data.id,
            quantity: 1,
            price: item.total,
          },
        ])
      }
    }

    return data[0]
  } catch (error) {
    console.log('Error saving order:', error.message)
    return null
  }
}

/**
 * Get user's orders
 */
export async function getUserOrders(email) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_price,
        status,
        created_at,
        items:order_items(count)
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return data.map(order => ({
      orderId: order.order_number,
      total: order.total_price,
      status: order.status,
      createdAt: order.created_at,
      itemCount: order.items.length,
    }))
  } catch (error) {
    console.log('Error fetching orders:', error.message)
    return []
  }
}

/**
 * Get all suppliers
 */
export async function getSuppliers() {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, website, rating, review_count')

    if (error) throw error
    
    return data
  } catch (error) {
    console.log('Error fetching suppliers:', error.message)
    return []
  }
}
