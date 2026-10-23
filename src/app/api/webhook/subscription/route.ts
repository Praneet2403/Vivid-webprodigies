export const dynamic = 'force-dynamic';
import crypto from 'node:crypto';
import {client} from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
      const rawBody = await req.text()

      const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
      if (!secret) {
        console.error('LEMON_SQUEEZY_WEBHOOK_SECRET is not set')
        return Response.json({message: 'Webhook not configured'}, {status: 500})
      }

      // Verify the signature before trusting anything in the body
      const digest = Buffer.from(
        crypto.createHmac('sha256', secret).update(rawBody).digest('hex'),
        'utf8'
      )
      const signature = Buffer.from(req.headers.get('X-Signature') || '', 'utf8')

      if (
        digest.length !== signature.length ||
        !crypto.timingSafeEqual(digest, signature)
      ) {
        return Response.json({message: 'Invalid signature'}, {status: 401})
      }

      const body = JSON.parse(rawBody)
      const buyerUserId = body?.meta?.custom_data?.buyerUserId

      if (!buyerUserId) {
        return Response.json({message: 'Missing buyerUserId'}, {status: 400})
      }

      const buyer = await client.user.updateMany({
        where: {
          id:buyerUserId,
        },
        data: {
          subscription: true
        },
      })
      if(buyer.count === 0){
        return Response.json({message: 'Buyer not found'}, {status: 404})
      }

      return Response.json({message: 'Subscription updated'}, {status: 200})
  
    } catch (error) {
        console.error('Error in POST handler:',error)
        return Response.json({message: 'Internal server error'}, {status: 500})
    }
  }
