"use server";

import { prisma } from "@/lib/prisma";

/**
 * ANALYTICS ACTIONS
 * Business intelligence and operational metrics
 */

export async function getAnalytics(timeRange = "7d", workspaceId) {
    try {
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [
            allBookingsWithinRange,
            totalContacts,
            pendingForms,
            bookingsByStatus,
            services
        ] = await Promise.all([
            // Total bookings in range with prices
            prisma.booking.findMany({
                where: {
                    createdAt: { gte: startDate }
                },
                include: {
                    serviceType: {
                        select: { price: true }
                    }
                }
            }),

            // Total contacts
            prisma.contact.count(),

            // Pending compliance forms
            prisma.formInstance.count({
                where: { status: "PENDING" }
            }),

            // Bookings by status
            prisma.booking.groupBy({
                by: ['status'],
                _count: true
            }),

            // Service popularity
            prisma.serviceType.findMany({
                include: {
                    _count: {
                        select: { bookings: true }
                    }
                },
                orderBy: {
                    bookings: { _count: 'desc' }
                },
                take: 10
            })
        ]);

        const totalBookingsCount = allBookingsWithinRange.length;
        const totalRevenue = allBookingsWithinRange.reduce((sum, b) => {
            const price = Number(b.serviceType?.price || 0);
            return sum + price;
        }, 0);

        // Revenue Trend breakdown
        const trendMap = {};
        for (let i = 0; i < days; i++) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            trendMap[dateStr] = { revenue: 0, count: 0 };
        }

        allBookingsWithinRange.forEach(b => {
            const dateStr = new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
            if (trendMap[dateStr]) {
                trendMap[dateStr].revenue += Number(b.serviceType?.price || 0);
                trendMap[dateStr].count += 1;
            }
        });

        const revenueTrend = Object.entries(trendMap)
            .map(([date, data]) => ({ date, revenue: data.revenue, bookings: data.count }))
            .reverse();

        // Format status data for Recharts
        const formattedStatus = bookingsByStatus.map(b => ({
            name: b.status,
            value: b._count
        }));

        // Format service data for progress bars
        const topServices = services.map(s => ({
            name: s.name,
            count: s._count.bookings
        })).filter(s => s.count > 0);

        // Fallback for empty states
        const finalTopServices = topServices.length > 0 ? topServices : [
            { name: "No Data Available", count: 0 }
        ];

        return {
            revenue: {
                total: totalRevenue,
                change: 0
            },
            customers: {
                new: totalContacts,
                change: 0
            },
            bookings: {
                total: totalBookingsCount,
                change: 0
            },
            completionRate: totalBookingsCount > 0 ? Math.round(((totalBookingsCount - pendingForms) / totalBookingsCount) * 100) : 100,
            completionRateChange: 0,
            revenueTrend,
            bookingsByStatus: formattedStatus.length > 0 ? formattedStatus : [{ name: 'None', value: 0 }],
            topServices: finalTopServices
        };
    } catch (error) {
        console.error("[GET-ANALYTICS]", error);
        return {
            revenue: { total: 0, change: 0 },
            customers: { new: 0, change: 0 },
            bookings: { total: 0, change: 0 },
            completionRate: 0,
            completionRateChange: 0,
            revenueTrend: [],
            bookingsByStatus: [{ name: 'None', value: 0 }],
            topServices: []
        };
    }
}
