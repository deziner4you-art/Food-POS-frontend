import { useNavigate } from 'react-router-dom';
import { Percent } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BACKEND_URL } from '../hooks/useStoreData';

export default function PromotionsPage({ onApplyCoupon }: { onApplyCoupon: (coupon: any) => void }) {
  const { campaigns } = useStore();
  const navigate = useNavigate();

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Percent className="w-10 h-10 text-stitch-muted mx-auto mb-3" />
        <p className="text-stitch-muted font-bold">No active promotions right now — check back soon!</p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-8">
        <p className="text-stitch-accent text-xs font-black uppercase tracking-widest mb-1">Limited Time</p>
        <h2 className="text-xl sm:text-3xl font-black flex items-center gap-2 text-stitch-ink">
          <Percent className="w-6 h-6 text-stitch-accent" /> SPECIAL OFFERS
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign: any) => {
          const badgeText =
            campaign.campaign_type === 'BOGO'
              ? `BOGO — BUY ${campaign.buy_qty} GET ${campaign.reward_qty} ${campaign.reward_type === 'PERCENTAGE' ? `${campaign.discount_pct}% OFF` : 'FREE'}`
              : campaign.campaign_type === 'FLAT'
                ? `SALE — Rs.${campaign.flat_discount_amount} OFF`
                : `SALE — ${campaign.discount_pct}% OFF`;

          const autoApplyTypes = ['BOGO', 'BUNDLE', 'COMBO', 'FREE_GIFT'];

          return (
            <div key={campaign.id} className="bg-stitch-card border border-stitch-border hover:border-stitch-accent rounded-2xl p-6 relative overflow-hidden group transition duration-300 flex flex-col justify-between">
              {campaign.image_url && (
                <div className="absolute inset-0 z-0">
                  <img src={campaign.image_url.startsWith('http') ? campaign.image_url : `${BACKEND_URL}${campaign.image_url}`} className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" alt={campaign.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stitch-card via-stitch-card/90 to-transparent"></div>
                </div>
              )}

              <div className="relative z-10">
                <span className="bg-stitch-accent text-stitch-accent-ink text-[10px] font-black px-2.5 py-1 rounded mb-4 inline-block uppercase tracking-wider shadow-lg">
                  {badgeText}
                </span>
                <h3 className="text-lg sm:text-xl font-bold mb-1 text-stitch-ink">{campaign.title}</h3>
                <p className="text-stitch-muted text-xs sm:text-sm mb-4 leading-relaxed line-clamp-2">{campaign.description}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-stitch-border relative z-10">
                <span className="text-[10px] font-bold text-stitch-accent tracking-wider font-mono uppercase">OFFER</span>
                <button
                  onClick={() => {
                    if (!autoApplyTypes.includes(campaign.campaign_type)) {
                      onApplyCoupon({
                        code: `CAMP-${campaign.id}`,
                        name: campaign.title,
                        discountPercent: campaign.discount_pct,
                        description: campaign.description,
                        target_categories: campaign.target_categories,
                        target_products: campaign.target_products,
                      });
                    }
                    if (campaign.target_categories?.length > 0) {
                      navigate(`/menu?category=${encodeURIComponent(campaign.target_categories[0].name)}`);
                    } else {
                      navigate('/menu');
                    }
                  }}
                  className="bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink text-xs font-black py-2 px-4 rounded-full transition duration-300 accent-glow accent-glow-hover"
                >
                  {autoApplyTypes.includes(campaign.campaign_type) ? 'View Deal' : 'Avail Offer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
