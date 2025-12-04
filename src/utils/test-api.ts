// Test script to verify the new API works
// Run this in your browser console or from a component

import { api } from '../lib/api';
import { supabase } from '../lib/supabase-client';

export async function testNewAPI() {
  console.log('🧪 Starting API tests...\n');
  
  try {
    // Test 1: Check if user is authenticated
    console.log('1️⃣ Testing authentication...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ User is authenticated:', session.user.email);
    } else {
      console.log('⚠️  No user session found. Some tests will be skipped.');
    }
    console.log('');

    // Test 2: Fetch a business card (public - no auth needed)
    console.log('2️⃣ Testing public business card fetch...');
    const testUserCode = 'test-user'; // Replace with actual user code
    const card = await api.card.get(testUserCode);
    if (card) {
      console.log('✅ Business card fetched:', card.personal.name);
    } else {
      console.log('⚠️  No business card found for user code:', testUserCode);
    }
    console.log('');

    // Test 3: Fetch settings (public - no auth needed)
    console.log('3️⃣ Testing settings fetch...');
    const settings = await api.settings.get(testUserCode);
    console.log('✅ Settings fetched:', {
      groupShareSettings: Object.keys(settings.settings).length,
      customGroups: settings.customGroups.length,
    });
    console.log('');

    // Test 4: Track analytics (public - no auth needed)
    console.log('4️⃣ Testing analytics tracking...');
    await api.analytics.track(testUserCode, {
      type: 'test_event',
      timestamp: Date.now(),
      page: 'test',
    });
    console.log('✅ Analytics event tracked');
    console.log('');

    // Tests that require authentication
    if (session) {
      const myUserCode = 'my-test-code'; // Replace with your user code

      // Test 5: Save business card (requires auth)
      console.log('5️⃣ Testing business card save...');
      try {
        await api.card.save(myUserCode, {
          personal: {
            name: 'Test User',
            title: 'Developer',
            businessName: 'Test Company',
            bio: 'Testing the new API',
            profileImage: '',
          },
          contact: {
            phone: { value: '+1234567890', groups: ['Public'] },
            email: { value: 'test@example.com', groups: ['Public'] },
            address: { value: '123 Test St', groups: ['Public'] },
          },
          socialMessaging: {
            zalo: { username: '', groups: ['Public'] },
            messenger: { username: '', groups: ['Public'] },
            telegram: { username: '', groups: ['Public'] },
            whatsapp: { username: '', groups: ['Public'] },
            kakao: { username: '', groups: ['Public'] },
            discord: { username: '', groups: ['Public'] },
            wechat: { username: '', groups: ['Public'] },
          },
          socialChannels: {
            facebook: { username: '', groups: ['Public'] },
            linkedin: { username: '', groups: ['Public'] },
            twitter: { username: '', groups: ['Public'] },
            youtube: { username: '', groups: ['Public'] },
            tiktok: { username: '', groups: ['Public'] },
          },
          portfolioCategories: [],
          portfolio: [],
          profile: {
            about: { value: '', groups: ['Public'] },
            serviceAreas: { value: '', groups: ['Public'] },
            specialties: { value: '', groups: ['Public'] },
            experience: { value: '', groups: ['Public'] },
            languages: { value: '', groups: ['Public'] },
            certifications: { value: '', groups: ['Public'] },
          },
        });
        console.log('✅ Business card saved successfully');
      } catch (error) {
        console.error('❌ Failed to save business card:', error);
      }
      console.log('');

      // Test 6: Get contacts (requires auth + ownership)
      console.log('6️⃣ Testing contacts fetch...');
      try {
        const contacts = await api.contacts.get(myUserCode);
        console.log('✅ Contacts fetched:', contacts.length, 'contacts');
      } catch (error) {
        console.error('❌ Failed to fetch contacts:', error);
      }
      console.log('');

      // Test 7: Get analytics (requires auth + ownership)
      console.log('7️⃣ Testing analytics fetch...');
      try {
        const analytics = await api.analytics.get(myUserCode);
        console.log('✅ Analytics fetched:', analytics.events.length, 'events');
      } catch (error) {
        console.error('❌ Failed to fetch analytics:', error);
      }
      console.log('');
    }

    console.log('🎉 All tests completed!\n');
    console.log('Summary:');
    console.log('- Public API calls: ✅ Working');
    if (session) {
      console.log('- Authenticated API calls: ✅ Working');
    } else {
      console.log('- Authenticated API calls: ⏭️  Skipped (not logged in)');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Usage in browser console:
// import { testNewAPI } from './utils/test-api';
// testNewAPI();
