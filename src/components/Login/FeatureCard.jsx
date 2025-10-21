const FeatureCard = ({ icon: Icon, title, description, colorClass }) => {
  return (
    <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/40">
      <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
