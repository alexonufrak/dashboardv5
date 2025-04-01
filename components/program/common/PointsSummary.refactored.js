import React, { useState } from 'react';
import { useUserPointsSummary, useUserPointsTransactions, useRewardItems, useClaimReward } from '@/lib/airtable/hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Gift, History, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@auth0/nextjs-auth0';

/**
 * PointsSummary Component - Refactored to use the new Airtable hooks
 * Displays user's points summary, transactions, and available rewards
 */
export default function PointsSummary() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Use our custom hooks for points data
  const { 
    data: pointsSummary, 
    isLoading: summaryLoading, 
    error: summaryError 
  } = useUserPointsSummary(user?.sub);
  
  const { 
    data: transactions, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useUserPointsTransactions(user?.sub);
  
  const {
    data: rewardItems,
    isLoading: rewardsLoading,
    error: rewardsError
  } = useRewardItems();
  
  const isLoading = summaryLoading || transactionsLoading || rewardsLoading;
  const error = summaryError || transactionsError || rewardsError;

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/3" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Points</CardTitle>
          <CardDescription className="text-red-600">
            {error.message || 'Failed to load points data'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Filter rewards the user can afford
  const affordableRewards = rewardItems?.filter(
    reward => reward.pointsCost <= pointsSummary?.available
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Points & Rewards
        </CardTitle>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transactions">History</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="summary" className="p-0">
          <PointsSummaryTab pointsSummary={pointsSummary} />
        </TabsContent>
        
        <TabsContent value="transactions" className="p-0">
          <TransactionsTab transactions={transactions} />
        </TabsContent>
        
        <TabsContent value="rewards" className="p-0">
          <RewardsTab 
            rewards={rewardItems} 
            affordableRewards={affordableRewards} 
            availablePoints={pointsSummary?.available || 0} 
            userId={user?.sub}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// Points Summary Tab Component
function PointsSummaryTab({ pointsSummary }) {
  if (!pointsSummary) {
    return (
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground">No points data available</p>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold">{pointsSummary.available}</h3>
        <p className="text-muted-foreground">Available Points</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary/5 rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <h4 className="font-semibold">{pointsSummary.total}</h4>
          <p className="text-sm text-muted-foreground">Total Earned</p>
        </div>
        
        <div className="bg-primary/5 rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <h4 className="font-semibold">{pointsSummary.spent}</h4>
          <p className="text-sm text-muted-foreground">Total Spent</p>
        </div>
      </div>
      
      {pointsSummary.transactions && pointsSummary.transactions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pointsSummary.transactions.slice(0, 3).map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex justify-between items-center p-2 bg-accent/10 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium">{transaction.description || transaction.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.createdTime ? formatDistanceToNow(new Date(transaction.createdTime), { addSuffix: true }) : ''}
                  </p>
                </div>
                <Badge className={transaction.points >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {transaction.points >= 0 ? '+' : ''}{transaction.points}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  );
}

// Transactions History Tab Component
function TransactionsTab({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-6">
          <History className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
          <p className="text-muted-foreground">No transaction history available</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      <h4 className="text-sm font-medium mb-4">Points History</h4>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="flex justify-between items-start p-3 bg-accent/10 rounded-md"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{transaction.description || transaction.type}</p>
                <Badge variant="outline" className="text-xs">
                  {transaction.type}
                </Badge>
              </div>
              {transaction.teamName && (
                <p className="text-xs text-muted-foreground mt-1">Team: {transaction.teamName}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {transaction.createdTime ? formatDistanceToNow(new Date(transaction.createdTime), { addSuffix: true }) : 'Unknown date'}
              </p>
            </div>
            <Badge className={transaction.points >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {transaction.points >= 0 ? '+' : ''}{transaction.points}
            </Badge>
          </div>
        ))}
      </div>
    </CardContent>
  );
}

// Rewards Tab Component
function RewardsTab({ rewards, affordableRewards, availablePoints, userId }) {
  const [selectedReward, setSelectedReward] = useState(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const claimRewardMutation = useClaimReward();

  if (!rewards || rewards.length === 0) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-6">
          <Gift className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
          <p className="text-muted-foreground">No rewards available</p>
        </div>
      </CardContent>
    );
  }

  const handleClaimReward = async (deliveryDetails = '') => {
    if (!selectedReward || !userId) return;
    
    try {
      await claimRewardMutation.mutateAsync({
        userId,
        rewardId: selectedReward.id,
        deliveryDetails
      });
      
      setClaimDialogOpen(false);
      setSelectedReward(null);
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  return (
    <>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium">Available Rewards</h4>
          <Badge variant="outline">
            {availablePoints} points available
          </Badge>
        </div>
        
        <div className="space-y-3">
          {rewards.map((reward) => {
            const isAffordable = reward.pointsCost <= availablePoints;
            
            return (
              <div 
                key={reward.id} 
                className={`p-3 rounded-md border ${isAffordable ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{reward.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      {reward.description || 'No description available'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary">
                        {reward.pointsCost} points
                      </Badge>
                      {reward.category && (
                        <Badge variant="outline">
                          {reward.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {reward.imageUrl && (
                    <div className="w-16 h-16 rounded-md overflow-hidden">
                      <img 
                        src={reward.imageUrl} 
                        alt={reward.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <Button 
                    variant={isAffordable ? "default" : "outline"} 
                    size="sm" 
                    className="w-full"
                    disabled={!isAffordable || claimRewardMutation.isPending}
                    onClick={() => {
                      setSelectedReward(reward);
                      setClaimDialogOpen(true);
                    }}
                  >
                    {isAffordable ? (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Claim Reward
                      </>
                    ) : (
                      <>
                        {reward.pointsCost - availablePoints} more points needed
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      
      {/* Claim Reward Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Reward</DialogTitle>
          </DialogHeader>
          
          {selectedReward && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{selectedReward.name}</h3>
                <p className="text-muted-foreground">{selectedReward.description}</p>
                <Badge className="mt-2">{selectedReward.pointsCost} points</Badge>
              </div>
              
              <p className="mb-6">
                Are you sure you want to claim this reward? This will deduct {selectedReward.pointsCost} points from your account.
              </p>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setClaimDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleClaimReward()} 
                  disabled={claimRewardMutation.isPending}
                >
                  {claimRewardMutation.isPending ? 'Processing...' : 'Confirm & Claim'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}