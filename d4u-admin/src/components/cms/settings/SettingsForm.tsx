import type { FormEvent } from 'react';
import { Building2, MapPin, Share2, Truck } from 'lucide-react';
import SettingsSectionCard from './SettingsSectionCard';
import SettingsFieldGroup from './SettingsFieldGroup';
import SettingsInput from './SettingsInput';
import SettingsTextarea from './SettingsTextarea';

interface SettingsFormProps {
  settings: any;
  errors?: Record<string, string>;
  loading: boolean;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function SettingsForm({ settings, errors = {}, loading, onFieldChange, onSubmit }: SettingsFormProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-stitch-panel border border-stitch-border rounded-2xl p-8 h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <SettingsSectionCard title="Brand Identity" icon={Building2}>
          <SettingsFieldGroup>
            <SettingsInput
              label="Website Name"
              value={settings?.siteTitle}
              onChange={(v) => onFieldChange('siteTitle', v)}
              error={errors.siteTitle}
            />
            <SettingsInput
              label="Contact Email"
              type="email"
              value={settings?.contactEmail}
              onChange={(v) => onFieldChange('contactEmail', v)}
              error={errors.contactEmail}
            />
            <SettingsInput
              label="Phone"
              value={settings?.contactPhone}
              onChange={(v) => onFieldChange('contactPhone', v)}
              error={errors.contactPhone}
            />
          </SettingsFieldGroup>
        </SettingsSectionCard>

        <SettingsSectionCard title="Contact & Footer" icon={MapPin}>
          <SettingsFieldGroup>
            <SettingsInput
              label="Physical Address"
              value={settings?.address}
              onChange={(v) => onFieldChange('address', v)}
              error={errors.address}
            />
            <SettingsInput
              label="Google Map PIN (Embed URL)"
              value={settings?.googleMapUrl}
              onChange={(v) => onFieldChange('googleMapUrl', v)}
              placeholder="https://maps.google.com/..."
              error={errors.googleMapUrl}
            />
            <SettingsInput
              label="WhatsApp Number"
              value={settings?.whatsappNumber}
              onChange={(v) => onFieldChange('whatsappNumber', v)}
              error={errors.whatsappNumber}
            />
          </SettingsFieldGroup>
          <SettingsTextarea
            label="Footer Text"
            value={settings?.aboutText}
            onChange={(v) => onFieldChange('aboutText', v)}
            placeholder="The future of fast-casual dining..."
            error={errors.aboutText}
          />
          <SettingsTextarea
            label="Copyright"
            value={settings?.companyText}
            onChange={(v) => onFieldChange('companyText', v)}
            placeholder="Our Culinary Journey..."
            error={errors.companyText}
          />
        </SettingsSectionCard>

        <SettingsSectionCard title="Social Media" icon={Share2}>
          <SettingsFieldGroup>
            <SettingsInput
              label="Facebook URL"
              value={settings?.facebookUrl}
              onChange={(v) => onFieldChange('facebookUrl', v)}
              error={errors.facebookUrl}
            />
            <SettingsInput
              label="Instagram URL"
              value={settings?.instagramUrl}
              onChange={(v) => onFieldChange('instagramUrl', v)}
              error={errors.instagramUrl}
            />
            <SettingsInput
              label="Twitter (X) URL"
              value={settings?.twitterUrl}
              onChange={(v) => onFieldChange('twitterUrl', v)}
              error={errors.twitterUrl}
            />
            <SettingsInput
              label="YouTube URL"
              value={settings?.youtubeUrl}
              onChange={(v) => onFieldChange('youtubeUrl', v)}
              error={errors.youtubeUrl}
            />
          </SettingsFieldGroup>
        </SettingsSectionCard>
      </div>

      <div className="space-y-6 min-w-0">
        <SettingsSectionCard title="Tax & Delivery" icon={Truck}>
          <SettingsFieldGroup>
            <SettingsInput
              label="Tax / VAT %"
              type="number"
              value={settings?.tax_percentage}
              onChange={(v) => onFieldChange('tax_percentage', v)}
              placeholder="e.g. 10"
              error={errors.tax_percentage}
            />
            <SettingsInput
              label="Delivery Fee (Rs.)"
              type="number"
              value={settings?.delivery_fee}
              onChange={(v) => onFieldChange('delivery_fee', v)}
              placeholder="e.g. 150"
              error={errors.delivery_fee}
            />
            <SettingsInput
              label="Delivery Radius (km) — display only, not enforced"
              type="number"
              value={settings?.delivery_radius_km}
              onChange={(v) => onFieldChange('delivery_radius_km', v)}
              placeholder="e.g. 5"
              error={errors.delivery_radius_km}
            />
            <SettingsInput
              label="Free Delivery Above (Rs.) — 0 disables"
              type="number"
              value={settings?.min_order_free_delivery}
              onChange={(v) => onFieldChange('min_order_free_delivery', v)}
              placeholder="e.g. 2000"
              error={errors.min_order_free_delivery}
            />
          </SettingsFieldGroup>
        </SettingsSectionCard>
      </div>
    </form>
  );
}
