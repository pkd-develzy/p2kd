import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const s1 = SupabaseDbService.getSeksi1Client();
    const { data, error } = await s1
      .from("notifikasi_petugas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifikasi_petugas:", error.message);
      return NextResponse.json(
        { success: false, message: "Gagal mengambil data notifikasi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications: data || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Kesalahan server: " + msg },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const body = await req.json();
    const {
      judul,
      pesan,
      kategori,
      target_role,
      target_tps,
      image_url,
      is_banner,
      start_date,
      end_date,
    } = body;

    const hasImage = Boolean(image_url && String(image_url).trim());
    if (!hasImage && (!judul || !pesan)) {
      return NextResponse.json(
        { success: false, message: "Judul dan isi pesan notifikasi wajib diisi jika tidak menyertakan foto/poster banner." },
        { status: 400 }
      );
    }

    const s1 = SupabaseDbService.getSeksi1Client();
    const isBannerVal = Boolean(is_banner) || hasImage;

    // Format waktu publikasi WIB (ISO UTC string for DB)
    const startDateIso = start_date ? new Date(start_date).toISOString() : new Date().toISOString();
    const endDateIso = end_date && String(end_date).trim() ? new Date(end_date).toISOString() : null;

    // Jika banner baru ini langsung tayang (bukan terjadwal di masa depan), nonaktifkan banner aktif lama
    const now = new Date();
    const isCurrentlyActiveBanner = isBannerVal && new Date(startDateIso) <= now && (!endDateIso || new Date(endDateIso) >= now);

    if (isCurrentlyActiveBanner) {
      await s1
        .from("notifikasi_petugas")
        .update({ is_banner: false })
        .eq("is_banner", true);
    }

    const cleanJudul = judul ? String(judul).trim() : "";
    const cleanPesan = pesan ? String(pesan).trim() : "";

    const { data, error } = await s1
      .from("notifikasi_petugas")
      .insert({
        judul: cleanJudul,
        pesan: cleanPesan,
        kategori: kategori || (hasImage ? "PENGUMUMAN" : "INFO"),
        target_role: target_role || "SEMUA",
        target_tps: target_tps || "SEMUA",
        author: session.user.nama || session.user.username || "Admin P2KD",
        image_url: hasImage ? String(image_url).trim() : null,
        is_banner: isBannerVal,
        start_date: startDateIso,
        end_date: endDateIso,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notifikasi_petugas:", error.message);
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan notifikasi petugas: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isBannerVal 
        ? "Banner Pengumuman Bergambar In-App Berhasil Diterbitkan/Dijadwalkan untuk Beranda Petugas!"
        : "Notifikasi khusus aplikasi native petugas berhasil diterbitkan!",
      notification: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Kesalahan server: " + msg },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const body = await req.json();
    const { id, is_active, is_banner, start_date, end_date } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID notifikasi wajib disertakan." },
        { status: 400 }
      );
    }

    const s1 = SupabaseDbService.getSeksi1Client();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (typeof is_banner === "boolean") {
      updates.is_banner = is_banner;
      if (is_banner) {
        await s1.from("notifikasi_petugas").update({ is_banner: false }).eq("is_banner", true);
      }
    }
    if (start_date !== undefined) {
      updates.start_date = start_date ? new Date(start_date).toISOString() : new Date().toISOString();
    }
    if (end_date !== undefined) {
      updates.end_date = end_date && String(end_date).trim() ? new Date(end_date).toISOString() : null;
    }

    const { data, error } = await s1
      .from("notifikasi_petugas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: "Gagal memperbarui notifikasi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status notifikasi berhasil diperbarui.",
      notification: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Kesalahan server: " + msg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID notifikasi wajib disertakan." },
        { status: 400 }
      );
    }

    const s1 = SupabaseDbService.getSeksi1Client();
    const { error } = await s1.from("notifikasi_petugas").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, message: "Gagal menghapus notifikasi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifikasi petugas berhasil dihapus.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Kesalahan server: " + msg },
      { status: 500 }
    );
  }
}
