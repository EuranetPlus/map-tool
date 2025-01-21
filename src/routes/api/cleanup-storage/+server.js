import { json } from '@sveltejs/kit';
import { del, list } from '@vercel/blob';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
	try {
		// Get blob token at the start
		const blobToken = env.BLOB_READ_WRITE_TOKEN;
		if (!blobToken) {
			throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
		}

		console.log('Starting blob storage cleanup...');
		const { blobs } = await list({ token: blobToken });
		console.log(`Found ${blobs.length} files in blob storage`);

		for (const blob of blobs) {
			try {
				await del(blob.url, { token: blobToken });
				console.log(`Deleted blob: ${blob.url}`);
			} catch (error) {
				console.error(`Failed to delete blob: ${blob.url}`, error);
				throw error;
			}
		}

		// Verify cleanup
		const { blobs: remainingBlobs } = await list({ token: blobToken });
		console.log(`Cleanup completed. ${remainingBlobs.length} blobs remaining.`);

		return json({
			status: 'success',
			message: 'Blob storage cleaned up successfully',
			remainingBlobs: remainingBlobs.length
		});
	} catch (error) {
		console.error('Error during blob storage cleanup:', error);
		return json(
			{
				error: error.message || 'Failed to clean up blob storage',
				status: 'error'
			},
			{ status: error.status || 500 }
		);
	}
}
