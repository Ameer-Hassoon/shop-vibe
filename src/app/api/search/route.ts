import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { category: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        category: true,
        stock: true,
      },
      take: limit,
      orderBy: [
        { name: 'asc' },
      ],
    });

    const suggestions = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      inStock: p.stock > 0,
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();
    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const history = await prisma.searchHistory.create({
      data: {
        userId,
        query: query.trim(),
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Save search error:', error);
    return NextResponse.json({ error: 'Failed to save search' }, { status: 500 });
  }
}
