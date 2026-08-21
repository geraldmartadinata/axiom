export default function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-200px] left-[10%] w-[600px] h-[400px] bg-white/[2%] rounded-full blur-[120px]" />
      <div className="absolute top-[40%] right-[-200px] w-[500px] h-[500px] bg-white/[1.5%] rounded-full blur-[100px]" />
      <div className="absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] bg-white/[1%] rounded-full blur-[80px]" />
    </div>
  )
}
