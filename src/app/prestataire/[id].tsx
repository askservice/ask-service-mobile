import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState, type ComponentProps } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useVendorProfile } from '@/api/me'
import { Avatar } from '@/components/Avatar'
import { ReviewSheet } from '@/components/ReviewSheet'
import { Button, IconButton, Text } from '@/components/ui'
import { placeLabel, reviewDate, yearsLabel, type VendorPublicReview } from '@/lib/vendorProfile'
import { colors, radius } from '@/theme'

// Profile of a provider, opened from a conversation: public profile only (no contact details,
// main activity only), reviews, and « Laisser un avis » for the requests they handled.
export default function ProviderProfile() {
  const { id, requestRef } = useLocalSearchParams<{ id: string; requestRef?: string }>()
  const { data, isLoading, error } = useVendorProfile(id)
  const [reviewOpen, setReviewOpen] = useState(false)

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
      <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
      <Text weight="bold" style={{ fontSize: 16 }}>Profil du professionnel</Text>
    </View>
  )

  if (isLoading || error || !data?.vendor) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Ce profil n’est pas disponible.</Text>
          )}
        </View>
      </SafeAreaView>
    )
  }

  const { vendor, review } = data
  const requests = data.reviewable_requests ?? []
  const name = vendor.business_name || 'Professionnel'
  const place = placeLabel(vendor)
  const years = yearsLabel(vendor.years_of_activity)

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      {header}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={name} size={64} online={false} uri={vendor.profile_pic} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20 }}>{name}</Text>
              {vendor.is_verified ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="verified-user" size={15} color={colors.successDark} />
                  <Text weight="medium" style={{ fontSize: 13, color: colors.successDark }}>Professionnel vérifié</Text>
                </View>
              ) : null}
              {place ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="place" size={15} color={colors.textMuted} />
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{place}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Stars rating={review.averageRating} size={18} />
            <Text weight="bold">{review.totalReviews ? review.averageRating : '—'}</Text>
            <Text style={{ color: colors.textMuted }}>· {review.totalReviews} avis</Text>
          </View>

          {vendor.main_activity ? (
            <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }}>
              <Text weight="semibold" style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Activité principale</Text>
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primaryDim }}>
                <Text weight="semibold" style={{ color: colors.primaryDark }}>{vendor.main_activity.title}</Text>
              </View>
            </View>
          ) : null}

          {requests.length ? <Button label="Laisser un avis" onPress={() => setReviewOpen(true)} /> : null}
        </Card>

        {vendor.about_company || years || vendor.company_size ? (
          <Card>
            <Text weight="bold" accessibilityRole="header" style={{ fontSize: 17 }}>À propos</Text>
            {vendor.about_company ? <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{vendor.about_company}</Text> : null}
            {years ? <Fact icon="event" label="Années d’activité" value={years} /> : null}
            {vendor.company_size ? <Fact icon="groups" label="Taille de l’entreprise" value={vendor.company_size} /> : null}
          </Card>
        ) : null}

        <Card>
          <Text weight="bold" accessibilityRole="header" style={{ fontSize: 17 }}>Avis clients</Text>
          {review.reviews.length ? (
            review.reviews.map((r) => <ReviewRow key={r._id} review={r} />)
          ) : (
            <Text style={{ color: colors.textSecondary }}>
              Aucun avis pour l’instant.{requests.length ? ' Soyez le premier à partager votre expérience.' : ''}
            </Text>
          )}
        </Card>
      </ScrollView>

      {requests.length ? (
        <ReviewSheet
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          vendorId={vendor._id}
          name={name}
          requests={requests}
          requestRef={requestRef}
        />
      ) : null}
    </SafeAreaView>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, padding: 16, gap: 12 }}>
      {children}
    </View>
  )
}

function Stars({ rating, size }: { rating: number; size: number }) {
  // 4.5 shows 4 full stars: the exact average is written next to them.
  const full = Math.floor(rating)
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialIcons key={i} name={i <= full ? 'star' : 'star-border'} size={size} color={i <= full ? '#FFB900' : colors.textMuted} />
      ))}
    </View>
  )
}

function Fact({ icon, label, value }: { icon: ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <View>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
        <Text weight="semibold">{value}</Text>
      </View>
    </View>
  )
}

function ReviewRow({ review }: { review: VendorPublicReview }) {
  return (
    <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar name={review.author_name} size={34} online={false} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{review.author_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Stars rating={review.rating} size={14} />
            <Text style={{ fontSize: 12, color: colors.textMuted }}>{reviewDate(review.createdAt)}</Text>
          </View>
        </View>
      </View>
      {review.review ? <Text style={{ color: colors.text, lineHeight: 21 }}>{review.review}</Text> : null}
    </View>
  )
}
