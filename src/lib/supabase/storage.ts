import { supabase } from './config'

export const uploadImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(path, file)

  if (error) throw error

  const { data: publicUrl } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  return publicUrl.publicUrl
}

export const deleteImage = async (path: string) => {
  const { error } = await supabase.storage
    .from('product-images')
    .remove([path])

  return !error
}
