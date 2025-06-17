import { supabase } from './config'

export const getBookmarks = async (userId: string) => {
  const { data } = await supabase
    .from('bookmarks')
    .select('product_id')
    .eq('user_id', userId)

  return data?.map(item => item.product_id) || []
}

export const toggleBookmark = async (userId: string, productId: string) => {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
    return false
  }

  await supabase
    .from('bookmarks')
    .insert({ user_id: userId, product_id: productId })
  return true
}
