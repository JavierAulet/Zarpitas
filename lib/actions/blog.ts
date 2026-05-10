'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { BlogPostRow, BlogPostInsert } from '@/lib/supabase/types'

export type { BlogPostRow }

export async function getBlogPosts(): Promise<BlogPostRow[]> {
  const db = createServiceClient()
  const { data } = await db
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return (data ?? []) as BlogPostRow[]
}

export async function getBlogPost(slug: string): Promise<BlogPostRow | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (!data) return null
  const post = data as BlogPostRow
  void db.from('blog_posts').update({ views: post.views + 1 }).eq('id', post.id)
  return post
}

export async function getBlogPostsAdmin(): Promise<BlogPostRow[]> {
  const db = createServiceClient()
  const { data } = await db
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as BlogPostRow[]
}

export async function getBlogPostAdmin(id: string): Promise<BlogPostRow | null> {
  const db = createServiceClient()
  const { data } = await db.from('blog_posts').select('*').eq('id', id).single()
  return (data ?? null) as BlogPostRow | null
}

export async function createBlogPost(post: BlogPostInsert): Promise<string> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('blog_posts')
    .insert({ ...post, updated_at: new Date().toISOString() })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return (data as { id: string }).id
}

export async function updateBlogPost(id: string, post: Partial<BlogPostInsert>): Promise<void> {
  const db = createServiceClient()
  const { error } = await db
    .from('blog_posts')
    .update({ ...post, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
}

export async function deleteBlogPost(id: string): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.from('blog_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
}

export async function toggleBlogPostStatus(id: string, status: 'draft' | 'published'): Promise<void> {
  const db = createServiceClient()
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'published') updateData.published_at = new Date().toISOString()
  const { error } = await db.from('blog_posts').update(updateData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
}
