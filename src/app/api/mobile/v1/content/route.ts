import { getPostCategories, getPosts } from '@/lib/queries/posts'
import { mobileSuccess } from '@/lib/mobile-response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || undefined
  const category = searchParams.get('category')?.trim() || undefined
  const [posts, categories] = await Promise.all([
    getPosts({ status: 'APPROVED', q: query, category }),
    getPostCategories(),
  ])

  const mobilePosts = posts.map(({ user, tags, ...post }) => ({
    ...post,
    author: user ? { id: user.id, name: user.name } : null,
    tags: tags.map(({ tag }) => tag),
  }))
  return mobileSuccess({ posts: mobilePosts, categories })
}
